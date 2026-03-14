// src/components/PuzzleBoard.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  createBoard,
  removeBlocks,
  dropBlocks,
  calculateScore,
  activateBomb,
  ROWS,
  COLS
} from '../logic/puzzle';

import { particleEngine } from '../effects/particles';
import { shakeScreen } from '../effects/animations';
import { playSound } from '../effects/audio';

export default function PuzzleBoard({ onBack, userId }) {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [bombCount, setBombCount] = useState(0); 
  const [isBombMode, setIsBombMode] = useState(false);

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState(""); 
  
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState({ x: -1, y: -1 });

  const [comboCount, setComboCount] = useState(0);
  const comboTimerRef = useRef(null);

  const API_BASE = "http://127.0.0.1:5000";

  useEffect(() => {
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, []);

  // 初期化とボム所持数の取得
  useEffect(() => {
    particleEngine.init();
    setBoard(createBoard());

    const fetchInventory = async () => {
      if (!userId) return; 
      try {
        const response = await fetch(`${API_BASE}/api/user/inventory?user_id=${userId}`);
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

  // ゲームオーバー処理
  const handleGameOver = (reason) => {
    setGameOverReason(reason);
    setIsGameOver(true);
    if (!userId) return;
    fetch(`${API_BASE}/api/game/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, score: score }),
    }).catch(() => {});
  };

  // 盤面に「消せるブロック」が残っているか判定
  const hasAvailableMoves = (currentBoard) => {
    for (let y = 0; y < currentBoard.length; y++) {
      for (let x = 0; x < currentBoard[y].length; x++) {
        const color = currentBoard[y][x].color;
        if (color >= 1 && color <= 4) {
          if (x + 1 < currentBoard[y].length && currentBoard[y][x + 1].color === color) return true;
          if (y + 1 < currentBoard.length && currentBoard[y + 1][x].color === color) return true;
        }
      }
    }
    return false; 
  };

  // タイマー進行と時間切れ判定
  useEffect(() => {
    if (isGameStarted && timeLeft > 0 && !isGameOver && !isPaused) {
      const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerId);
    } else if (isGameStarted && timeLeft === 0 && !isGameOver) {
      handleGameOver("TIME UP!");
    }
  }, [isGameStarted, timeLeft, isGameOver, isPaused]);

  // 手詰まり（詰み）の監視
  useEffect(() => {
    if (isGameStarted && !isGameOver && board.length > 0) {
      const canMove = hasAvailableMoves(board);
      if (!canMove && bombCount <= 0) {
        handleGameOver("NO MORE MOVES...");
      }
    }
  }, [board, bombCount, isGameStarted, isGameOver]);

  // 🌟 一定間隔（4秒）で岩ブロックを降らせる処理
  useEffect(() => {
    if (!isGameStarted || isGameOver || isPaused) return;

    const ROCK_INTERVAL_MS = 4000; 

    const rockInterval = setInterval(() => {
      setBoard(prevBoard => {
        const newBoard = prevBoard.map(row => row.map(block => ({ ...block })));
        
        const validTargets = [];
        for (let y = 0; y < newBoard.length; y++) {
          for (let x = 0; x < newBoard[y].length; x++) {
            if (newBoard[y][x].color >= 1 && newBoard[y][x].color <= 4) {
              validTargets.push({ x, y });
            }
          }
        }

        if (validTargets.length > 0) {
          const rand = validTargets[Math.floor(Math.random() * validTargets.length)];
          newBoard[rand.y][rand.x].color = 5; // 岩ブロック
          playSound('bomb'); 
          shakeScreen(false); 
        }
        return newBoard;
      });
    }, ROCK_INTERVAL_MS);

    return () => clearInterval(rockInterval);
  }, [isGameStarted, isGameOver, isPaused]);


  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBlockClick = (e, x, y) => {
    if (!isGameStarted || !board || board.length === 0 || isGameOver || isPaused) return;
    if (!isBombMode && (board[y][x].color === 0 || board[y][x].color === 5)) return; 

    const targetColor = getBlockColor(board[y][x].color);
    const wasBombAction = isBombMode;

    let resultBoard;
    let removedCount = 0;
    let usedBombThisTurn = false; 

    if (isBombMode) {
      const result = activateBomb(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
      usedBombThisTurn = true; 
      
      setBombCount(prev => prev - 1);
      setIsBombMode(false);
      setHoveredBlock({ x: -1, y: -1 });

      fetch(`${API_BASE}/api/game/use_bomb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      }).catch(err => console.error("💣 ボム消費エラー:", err));

    } else {
      const result = removeBlocks(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
    }

    if (removedCount > 0) {
      let earnedScore = calculateScore(removedCount, comboCount);
      
      if (usedBombThisTurn) {
        earnedScore *= 2;
      }
      
      setScore(prevScore => prevScore + earnedScore);

      const rect = e.target.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      if (wasBombAction) {
        playSound('bomb'); // 💥 爆発音
        shakeScreen(true); // 💥 激しい画面揺れ
        particleEngine.emit(clickX, clickY, targetColor, true); // 💥 大爆発エフェクト

        // ボムの時はド派手に「+〇」と出す （earnedScoreを表示してもいいかも）
        particleEngine.emitText(clickX, clickY, `+${removedCount}`, '#ffffff', true); 

      } else {
        // コンボ数に応じて音を高くするピッチアップ処理
        playSound('pop', comboCount);
        shakeScreen(false); // ✨ 軽い画面揺れ
        particleEngine.emit(clickX, clickY, targetColor, false); // ✨ 星が弾けるエフェクト
        // 通常は「〇」と消した数だけを出す
        particleEngine.emitText(clickX, clickY, `${removedCount}`, targetColor, false); 
      }

      // 既存の盤面更新と落下処理
      setBoard(resultBoard);
      setComboCount(prev => prev + 1);
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current);
      }
      comboTimerRef.current = setTimeout(() => {
        setComboCount(0); 
      }, 2000);
      
      setTimeout(() => {
        const droppedBoard = dropBlocks(resultBoard);
        setBoard(droppedBoard);
      }, 250); 
    }
  };

  const getBlockColor = (value) => {
    switch (value) {
      case 1: return '#ff4757';
      case 2: return '#1e90ff';
      case 3: return '#2ed573';
      case 4: return '#ffa502';
      case 5: return '#576574'; 
      default: return 'transparent';
    }
  };

  const currentMultiplier = Math.min(1 + (comboCount * 0.2), 5.0).toFixed(1);

  if (board.length === 0) return null;

  return (
    <div className="puzzle-screen game-container" style={styles.screenContainer}>

      {/* Google Fonts「VT323」（楽しいフォント）の読み込み */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        `}
      </style>

      {/* Google Fontsの読み込み */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}
      </style>
      
      <div onClick={onBack} style={styles.backButton}>← HOME</div>

      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={styles.timerDisplay}>⏱ {formatTime(timeLeft)}</div>
          {isGameStarted && !isGameOver && (
            <button 
              onClick={() => setIsPaused(true)} 
              style={styles.pauseBtnIcon}
            >
              ⏸
            </button>
          )}
        </div>

        <div style={styles.infoDisplay}>
          <div style={styles.scoreText}>SCORE: {score}</div>
          <div style={styles.bombText}>💣: {bombCount}</div>
          {/* 🌟 修正ポイント：&& を消して visibility で表示・非表示を切り替える */}
          <div style={{
            ...styles.comboContainer,
            visibility: comboCount > 0 ? 'visible' : 'hidden'
          }}>
            <span style={styles.comboText}>{comboCount} COMBO!! 🔥</span>
            <span style={styles.multiplierText}>×{currentMultiplier}</span>
          </div>
        </div>
      </div>

      <div style={{
        ...styles.boardPanel,
        opacity: isGameOver || isPaused ? 0.3 : 1 
      }}>
        <div style={styles.boardInner}>
          {board.map((row, y) => 
            row.map((block, x) => {
              const isHoveredBombRange = isBombMode && 
                                         hoveredBlock.x !== -1 && hoveredBlock.y !== -1 &&
                                         Math.abs(hoveredBlock.x - x) <= 1 && 
                                         Math.abs(hoveredBlock.y - y) <= 1;

              return (
                <div
                  key={block.id} 
                  onClick={(e) => handleBlockClick(e, x, y)}
                  onMouseEnter={() => isBombMode && setHoveredBlock({ x, y })}
                  onMouseLeave={() => isBombMode && setHoveredBlock({ x: -1, y: -1 })}
                  style={{
                    ...styles.block,
                    position: 'absolute', 
                    left: `${x * 56}px`,  
                    top: `${y * 56}px`,   
                    backgroundColor: getBlockColor(block.color),
                    cursor: block.color === 0 || block.color === 5 || isGameOver || !isGameStarted || isPaused ? 'default' : (isBombMode ? 'crosshair' : 'pointer'),
                    
                    opacity: block.color === 0 ? 0 : (isBombMode ? (isHoveredBombRange ? 1 : 0.3) : 1),
                    transform: block.color === 0 ? 'scale(0)' : (isHoveredBombRange && !isGameOver && !isPaused ? 'scale(1.08)' : 'scale(1)'),
                    
                    border: isHoveredBombRange && block.color !== 0 && !isGameOver && !isPaused ? '3px solid #ffffff' : 'none',
                    boxShadow: isHoveredBombRange && block.color !== 0 && !isGameOver && !isPaused
                      ? '0 0 15px rgba(255, 255, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.5)' 
                      : (block.color !== 0 && block.color !== 5 ? 'inset 0 -5px 0 rgba(0,0,0,0.15)' : 'none'),
                    zIndex: isHoveredBombRange ? 2 : 1, 
                    
                    transition: 'top 0.4s cubic-bezier(0.25, 1, 0.5, 1), left 0.4s ease, transform 0.2s ease, opacity 0.2s ease',
                  }}
                >
                  {block.color === 5 && <span style={{ fontSize: '26px' }}>🪨</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={styles.bombBtnContainer}>
        <button 
          onClick={() => {
            if (isGameStarted && bombCount > 0 && !isGameOver && !isPaused) {
              setIsBombMode(!isBombMode);
              if (isBombMode) setHoveredBlock({ x: -1, y: -1 }); 
            }
          }}
          disabled={!isGameStarted || isGameOver || bombCount <= 0 || isPaused} 
          style={{
            ...styles.bombBtn,
            background: isBombMode ? 'linear-gradient(45deg, #ff4757, #ff6b81)' : 'linear-gradient(45deg, #1e90ff, #70a1ff)',
            boxShadow: isBombMode ? styles.bombBtnShadowRed : (bombCount > 0 && isGameStarted && !isGameOver && !isPaused ? styles.bombBtnShadowBlue : 'none'),
            opacity: bombCount > 0 && isGameStarted && !isGameOver && !isPaused ? 1 : 0.5,
            cursor: bombCount > 0 && isGameStarted && !isGameOver && !isPaused ? 'pointer' : 'not-allowed',
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
      
      {isPaused && (
        <div style={styles.overlay}>
          <div style={styles.pausePanel}>
            <h1 style={styles.titleText}>PAUSE</h1>
            <button onClick={() => setIsPaused(false)} style={styles.resumeBtn}>▶ RESUME</button>
            <div style={{ marginTop: '20px' }}>
              <button onClick={onBack} style={styles.goHomeBtn}>ホームへ戻る</button>
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div style={styles.overlay}>
          <div style={styles.gameOverPanel}>
            <h1 style={styles.timeUpText}>{gameOverReason}</h1>
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
  
  pauseBtnIcon: { 
    background: 'none', border: '2px solid #1e90ff', color: '#1e90ff', fontSize: '24px', 
    borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    boxShadow: '0 0 10px rgba(30, 144, 255, 0.5)', transition: 'all 0.2s'
  },

  infoDisplay: { display: 'flex', flexDirection: 'column', gap: '5px' },
  scoreText: { fontSize: '28px', fontWeight: 'bold', color: '#1e90ff', textShadow: '0 0 5px rgba(30, 144, 255, 0.7)' },
  bombText: { fontSize: '28px', fontWeight: 'bold', color: '#f1f2f6', textShadow: '0 0 5px rgba(241, 242, 246, 0.7)' },
  
  // PuzzleBoard.jsx の styles の一部を変更
  comboContainer: { display: 'flex', alignItems: 'baseline', gap: '8px' },
  comboText: { fontFamily: '"Press Start 2P", cursive', fontSize: '16px', color: '#ffa502', textShadow: '0 0 8px rgba(255, 165, 2, 0.8)' },
  multiplierText: { fontFamily: '"Press Start 2P", cursive', fontSize: '14px', color: '#ff4757', textShadow: '0 0 8px rgba(255, 71, 87, 0.8)' },
  boardPanel: {
    padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    borderRadius: '16px', border: '3px solid #1e90ff', 
    boxShadow: '0 0 15px rgba(30, 144, 255, 0.5), inset 0 0 10px rgba(30, 144, 255, 0.3)', 
    transition: 'opacity 0.3s ease-in-out',
  },
  boardInner: { position: 'relative', width: '442px', height: '442px' },
  block: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '50px', height: '50px', borderRadius: '10px' },
  
  bombBtnContainer: { marginTop: '25px', marginBottom: '30px' },
  bombBtn: { padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '12px' },
  bombBtnShadowBlue: '0 0 10px rgba(30, 144, 255, 0.7), 0 0 20px rgba(30, 144, 255, 0.5)',
  bombBtnShadowRed: '0 0 10px rgba(255, 71, 87, 0.7), 0 0 20px rgba(255, 71, 87, 0.5)',
  
  overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  startPanel: { backgroundColor: 'rgba(10, 14, 23, 0.95)', border: '3px solid #1e90ff', padding: '50px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' },
  pausePanel: { backgroundColor: 'rgba(10, 14, 23, 0.95)', border: '3px solid #ffa502', padding: '50px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 0 20px rgba(255, 165, 2, 0.5)' },
  resumeBtn: { padding: '15px 30px', fontSize: '24px', fontWeight: 'bold', backgroundColor: '#ffa502', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 165, 2, 0.7)' },

  titleText: { fontSize: '48px', margin: '0 0 30px 0', color: '#1e90ff', textShadow: '0 0 10px rgba(30, 144, 255, 0.7)' },
  startBtn: { padding: '15px 30px', fontSize: '24px', fontWeight: 'bold', backgroundColor: '#1e90ff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 0 15px rgba(30, 144, 255, 0.7)' },
  gameOverPanel: { backgroundColor: 'rgba(10, 14, 23, 0.95)', border: '3px solid #ff4757', padding: '40px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 0 20px rgba(255, 71, 87, 0.5)' },
  timeUpText: { fontSize: '64px', margin: '0 0 15px 0', color: '#ff4757', textShadow: '0 0 10px rgba(255, 71, 87, 0.7), 0 0 20px rgba(255, 71, 87, 0.5)' },
  finalScoreText: { fontSize: '32px', margin: '0 0 30px 0', color: '#f1f2f6' },
  goHomeBtn: { padding: '12px 24px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#1e90ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};