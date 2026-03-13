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
  // 🌟 追加：残り時間を岩落下タイマーの中で参照するためのRef
  const timeLeftRef = useRef(timeLeft); 
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState(""); 
  
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState({ x: -1, y: -1 });

  const [comboCount, setComboCount] = useState(0);
  const comboTimerRef = useRef(null);

  const API_BASE = "http://127.0.0.1:5000";

  // タイマーが更新されるたびにRefにも最新の時間を保存する
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, []);

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

  useEffect(() => {
    if (isGameStarted && timeLeft > 0 && !isGameOver && !isPaused) {
      const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerId);
    } else if (isGameStarted && timeLeft === 0 && !isGameOver) {
      handleGameOver("TIME UP!");
    }
  }, [isGameStarted, timeLeft, isGameOver, isPaused]);

  useEffect(() => {
    if (isGameStarted && !isGameOver && board.length > 0) {
      const canMove = hasAvailableMoves(board);
      if (!canMove && bombCount <= 0) {
        handleGameOver("NO MORE MOVES...");
      }
    }
  }, [board, bombCount, isGameStarted, isGameOver]);

  // 🌟 変更：残り時間に応じて間隔が狭まる岩落下システム
  useEffect(() => {
    if (!isGameStarted || isGameOver || isPaused) return;

    let timeoutId;

    const scheduleNextRock = () => {
      // 🌟 残り時間（割合）を計算：最初(60秒)は1.0、最後(0秒)は0.0
      const ratio = Math.max(0, timeLeftRef.current) / 60;
      
      // 🌟 落下間隔の計算：最短2000ms（2秒）〜 最長8000ms（8秒）
      // 残り時間が減る（ratioが小さくなる）ほど、delayが短くなる！
      const delay = 2000 + (6000 * ratio);

      timeoutId = setTimeout(() => {
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
            newBoard[rand.y][rand.x].color = 5;
            playSound('bomb'); // 岩が落ちた音
            shakeScreen(false); // 軽く揺れる
          }
          return newBoard;
        });

        // 🌟 終わったら次の岩をセット（徐々に早くなる）
        scheduleNextRock();
      }, delay);
    };

    // ループ開始
    scheduleNextRock();

    // コンポーネントが消える時やポーズ時は安全に止める
    return () => clearTimeout(timeoutId);
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
        playSound('bomb'); 
        shakeScreen(true); 
        particleEngine.emit(clickX, clickY, targetColor, true); 
      } else {
        playSound('pop', comboCount);
        shakeScreen(false); 
        particleEngine.emit(clickX, clickY, targetColor, false); 
      }

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
          {comboCount > 0 && (
            <div style={styles.comboContainer}>
              <span style={styles.comboText}>{comboCount} COMBO!! 🔥</span>
              <span style={styles.multiplierText}>×{currentMultiplier}</span>
            </div>
          )}
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
  comboText: { 
    fontFamily: '"Bungee", cursive', // アーケード風極太フォント
    fontSize: '32px', 
    color: '#ffa502', 
    textShadow: '0 0 10px rgba(255, 165, 2, 0.9), 2px 2px 0px #b33939' // 影を濃くして立体感を出す
  },
  multiplierText: { 
    fontFamily: '"Bungee", cursive', 
    fontSize: '28px', 
    color: '#ff4757', 
    textShadow: '0 0 10px rgba(255, 71, 87, 0.9), 2px 2px 0px #b33939' 
  },
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