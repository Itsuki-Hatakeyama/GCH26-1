// src/components/PuzzleBoard.jsx

import React, { useState, useEffect } from 'react';
import {
  createBoard,
  removeBlocks,
  dropBlocks,
  calculateScore,
  activateBomb,
  ROWS,
  COLS
} from '../logic/puzzle';

export default function PuzzleBoard({ onBack, userId }) {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [bombCount, setBombCount] = useState(0); 
  const [isBombMode, setIsBombMode] = useState(false);

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState({ x: -1, y: -1 });

  useEffect(() => {
    setBoard(createBoard());

    const fetchInventory = async () => {
      if (!userId) return; 
      try {
        const response = await fetch(`http://localhost:5000/api/user/inventory?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setBombCount(data.items?.bomb || 0); 
        }
      } catch (error) {
        console.error('🔌 通信エラー:', error);
      }
    };
    fetchInventory();
  }, [userId]);

  useEffect(() => {
    if (isGameStarted && timeLeft > 0 && !isGameOver) {
      const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerId);
    } else if (isGameStarted && timeLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      const sendScoreToBackend = async () => {
        if (!userId) return;
        try {
          await fetch('http://localhost:5000/api/game/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score }),
          });
        } catch (error) {}
      };
      sendScoreToBackend();
    }
  }, [isGameStarted, timeLeft, isGameOver, score, userId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBlockClick = (x, y) => {
    if (!isGameStarted || !board || board.length === 0 || isGameOver) return;
    if (!isBombMode && board[y][x].color === 0) return; // 🌟 変更: .color を見る

    let resultBoard;
    let removedCount = 0;

    if (isBombMode) {
      const result = activateBomb(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
      
      setBombCount(prev => prev - 1);
      setIsBombMode(false);
      setHoveredBlock({ x: -1, y: -1 });
    } else {
      const result = removeBlocks(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
    }

    if (removedCount > 0) {
      const earnedScore = calculateScore(removedCount);
      setScore(prevScore => prevScore + earnedScore);

      setBoard(resultBoard);
      
      // 🌟 ブロックが消えるアニメーションを見せるため、落とすまで少し待つ！
      setTimeout(() => {
        const droppedBoard = dropBlocks(resultBoard);
        setBoard(droppedBoard);
      }, 250); // 250ミリ秒後にストンと落ちる
    }
  };

  const getBlockColor = (value) => {
    switch (value) {
      case 1: return '#ff4757';
      case 2: return '#1e90ff';
      case 3: return '#2ed573';
      case 4: return '#ffa502';
      default: return 'transparent';
    }
  };

  if (board.length === 0) return null;

  return (
    <div className="puzzle-screen" style={styles.screenContainer}>
      
      <div onClick={onBack} style={styles.backButton}>← HOME</div>

      <div style={styles.header}>
        <div style={styles.timerDisplay}>⏱ {formatTime(timeLeft)}</div>
        <div style={styles.infoDisplay}>
          <div style={styles.scoreText}>SCORE: {score}</div>
          <div style={styles.bombText}>💣: {bombCount}</div>
        </div>
      </div>

      <div style={{
        ...styles.boardPanel,
        opacity: isGameOver ? 0.3 : 1
      }}>
        {/* 🌟 落下アニメーションの要：相対位置のコンテナを用意 */}
        <div style={styles.boardInner}>
          {board.map((row, y) => 
            row.map((block, x) => {
              const isHoveredBombRange = isBombMode && 
                                         hoveredBlock.x !== -1 && hoveredBlock.y !== -1 &&
                                         Math.abs(hoveredBlock.x - x) <= 1 && 
                                         Math.abs(hoveredBlock.y - y) <= 1;

              return (
                <div
                  key={block.id} // 🌟 ここが超重要！IDがあるからReactが「どのブロックが落ちたか」追跡できる
                  onClick={() => handleBlockClick(x, y)}
                  onMouseEnter={() => isBombMode && setHoveredBlock({ x, y })}
                  onMouseLeave={() => isBombMode && setHoveredBlock({ x: -1, y: -1 })}
                  style={{
                    ...styles.block,
                    position: 'absolute', // 🌟 絶対座標に変更
                    left: `${x * 56}px`,  // x座標の計算 (50px + 隙間6px)
                    top: `${y * 56}px`,   // y座標の計算
                    backgroundColor: getBlockColor(block.color),
                    cursor: block.color === 0 || isGameOver || !isGameStarted ? 'default' : (isBombMode ? 'crosshair' : 'pointer'),
                    
                    // 🌟 0になったら透明にして縮小する
                    opacity: block.color === 0 ? 0 : (isBombMode ? (isHoveredBombRange ? 1 : 0.3) : 1),
                    transform: block.color === 0 ? 'scale(0)' : (isHoveredBombRange && !isGameOver ? 'scale(1.08)' : 'scale(1)'),
                    
                    border: isHoveredBombRange && block.color !== 0 && !isGameOver ? '3px solid #ffffff' : 'none',
                    boxShadow: isHoveredBombRange && block.color !== 0 && !isGameOver 
                      ? '0 0 15px rgba(255, 255, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.5)' 
                      : (block.color !== 0 ? 'inset 0 -5px 0 rgba(0,0,0,0.15)' : 'none'),
                    zIndex: isHoveredBombRange ? 2 : 1, 
                    
                    // 🌟 落下と消去のスムーズなアニメーション設定
                    transition: 'top 0.4s cubic-bezier(0.25, 1, 0.5, 1), left 0.4s ease, transform 0.2s ease, opacity 0.2s ease',
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      <div style={styles.bombBtnContainer}>
        <button 
          onClick={() => {
            if (isGameStarted && bombCount > 0 && !isGameOver) {
              setIsBombMode(!isBombMode);
              if (isBombMode) setHoveredBlock({ x: -1, y: -1 }); 
            }
          }}
          disabled={!isGameStarted || isGameOver || bombCount <= 0}
          style={{
            ...styles.bombBtn,
            background: isBombMode ? 'linear-gradient(45deg, #ff4757, #ff6b81)' : 'linear-gradient(45deg, #1e90ff, #70a1ff)',
            boxShadow: isBombMode ? styles.bombBtnShadowRed : (bombCount > 0 && isGameStarted && !isGameOver ? styles.bombBtnShadowBlue : 'none'),
            opacity: bombCount > 0 && isGameStarted && !isGameOver ? 1 : 0.5,
            cursor: bombCount > 0 && isGameStarted && !isGameOver ? 'pointer' : 'not-allowed',
          }}
        >
          {isBombMode ? '💣 落とす場所をタップ！' : `💣 ボムを使う`}
        </button>
      </div>

      {!isGameStarted && !isGameOver && (
        <div style={styles.overlay}>
          <div style={styles.startPanel}>
            <h1 style={styles.titleText}>PUZZLE START</h1>
            <button onClick={() => setIsGameStarted(true)} style={styles.startBtn}>MISSION START</button>
          </div>
        </div>
      )}
      
      {isGameOver && (
        <div style={styles.overlay}>
          <div style={styles.gameOverPanel}>
            <h1 style={styles.timeUpText}>TIME UP!</h1>
            <h2 style={styles.finalScoreText}>Score: {score}</h2>
            <button onClick={onBack} style={styles.goHomeBtn}>ホームへ戻る</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  screenContainer: {
    backgroundColor: '#0a0e17', color: '#f1f2f6', fontFamily: 'sans-serif',
    position: 'relative', minHeight: '100vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px',
  },
  backButton: { position: 'absolute', top: '20px', left: '20px', fontSize: '18px', fontWeight: 'bold', color: '#f1f2f6', cursor: 'pointer', opacity: 0.8 },
  header: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '20px', width: '90%', maxWidth: '600px' },
  timerDisplay: { fontSize: '64px', fontWeight: 'bold', color: '#1e90ff', textShadow: '0 0 10px rgba(30, 144, 255, 0.7), 0 0 20px rgba(30, 144, 255, 0.5)' },
  infoDisplay: { display: 'flex', flexDirection: 'column', gap: '5px' },
  scoreText: { fontSize: '28px', fontWeight: 'bold', color: '#1e90ff', textShadow: '0 0 5px rgba(30, 144, 255, 0.7)' },
  bombText: { fontSize: '28px', fontWeight: 'bold', color: '#f1f2f6', textShadow: '0 0 5px rgba(241, 242, 246, 0.7)' },
  
  boardPanel: {
    padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    borderRadius: '16px', border: '3px solid #1e90ff', 
    boxShadow: '0 0 15px rgba(30, 144, 255, 0.5), inset 0 0 10px rgba(30, 144, 255, 0.3)', 
    transition: 'opacity 0.3s ease-in-out',
  },
  // 🌟 アニメーションを機能させるための基準となる透明な箱
  boardInner: {
    position: 'relative',
    width: '442px', // (50px + 6px) * 8列 - 6px = 442px
    height: '442px',
  },
  block: {
    width: '50px', height: '50px', borderRadius: '10px',
  },
  
  bombBtnContainer: { marginTop: '25px', marginBottom: '30px' },
  bombBtn: { padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '12px' },
  bombBtnShadowBlue: '0 0 10px rgba(30, 144, 255, 0.7), 0 0 20px rgba(30, 144, 255, 0.5)',
  bombBtnShadowRed: '0 0 10px rgba(255, 71, 87, 0.7), 0 0 20px rgba(255, 71, 87, 0.5)',
  
  overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  startPanel: { backgroundColor: 'rgba(10, 14, 23, 0.95)', border: '3px solid #1e90ff', padding: '50px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' },
  titleText: { fontSize: '48px', margin: '0 0 30px 0', color: '#1e90ff', textShadow: '0 0 10px rgba(30, 144, 255, 0.7)' },
  startBtn: { padding: '15px 30px', fontSize: '24px', fontWeight: 'bold', backgroundColor: '#1e90ff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 0 15px rgba(30, 144, 255, 0.7)' },
  gameOverPanel: { backgroundColor: 'rgba(10, 14, 23, 0.95)', border: '3px solid #ff4757', padding: '40px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 0 20px rgba(255, 71, 87, 0.5)' },
  timeUpText: { fontSize: '64px', margin: '0 0 15px 0', color: '#ff4757', textShadow: '0 0 10px rgba(255, 71, 87, 0.7), 0 0 20px rgba(255, 71, 87, 0.5)' },
  finalScoreText: { fontSize: '32px', margin: '0 0 30px 0', color: '#f1f2f6' },
  goHomeBtn: { padding: '12px 24px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#1e90ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};