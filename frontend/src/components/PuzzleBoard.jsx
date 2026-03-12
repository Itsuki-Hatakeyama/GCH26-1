import React, { useState, useEffect } from 'react';
// 新妻さんが作った最強のロジックをインポート！
import {
  createBoard,
  removeBlocks,
  dropBlocks,
  calculateScore,
  activateBomb,
  ROWS,
  COLS
} from '../logic/puzzle';

// 🌟 App.jsから「ホームに戻る関数(onBack)」を受け取る
export default function PuzzleBoard({ onBack }) {
  // --- 状態（State）の管理 ---
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  
  // ボムの所持数（本番はApp.jsから受け取るのが理想）
  const [bombCount, setBombCount] = useState(3); 
  const [isBombMode, setIsBombMode] = useState(false);

  // ⏱ 2分間(120秒)のスコアアタック用タイマー
  const [timeLeft, setTimeLeft] = useState(120); 
  const [isGameOver, setIsGameOver] = useState(false);

  // 🌟 ボム使用時のホバー範囲を可視化するためのState
  const [hoveredBlock, setHoveredBlock] = useState({ x: -1, y: -1 });

  // 画面が開いた瞬間に、初期盤面を生成する
  useEffect(() => {
    setBoard(createBoard());
  }, []);

  // ⏱ タイマーのカウントダウン ＆ ゲーム終了時のスコア送信処理
  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerId); // クリーンアップ
    } else if (timeLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      
      // 🚀 大翔さんのバックエンドへスコアを送信！
      const sendScoreToBackend = async () => {
        try {
          // ※URLは大翔さんの環境に合わせて変更してください（例: 5000や8000）
          const response = await fetch('http://localhost:5000/api/score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ score: score }),
          });

          if (response.ok) {
            console.log(`🔥 スコア ${score} の送信に成功しました！`);
          } else {
            console.error('⚠️ バックエンドがエラーを返しました:', response.status);
          }
        } catch (error) {
          console.error('🔌 バックエンドと通信できませんでした:', error);
        }
      };

      sendScoreToBackend();
    }
  }, [timeLeft, isGameOver, score]);

  // ⏱ 時間を MM:SS 形式 (例: 2:00) に変換する関数
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- クリックされた時の処理 ---
  const handleBlockClick = (x, y) => {
    // 盤面がない、またはゲームオーバー時は操作させない
    if (!board || board.length === 0 || isGameOver) return;

    // 通常モードの時は、空のマス(0)をクリックしても無視する
    if (!isBombMode && board[y][x] === 0) return;

    let resultBoard;
    let removedCount = 0;

    // 💣 ボムモードがONの場合
    if (isBombMode) {
      const result = activateBomb(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
      
      // ボムを1個消費して、モードを解除する
      setBombCount(prev => prev - 1);
      setIsBombMode(false);
      setHoveredBlock({ x: -1, y: -1 }); // ボム解除時にホバーもリセット
    } 
    // 👆 通常のクリック（同色消し）の場合
    else {
      const result = removeBlocks(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
    }

    // 1個以上消えた場合（ボムまたは2個以上同色）
    if (removedCount > 0) {
      // スコア計算＆加算
      const earnedScore = calculateScore(removedCount);
      setScore(prevScore => prevScore + earnedScore);

      // 🌟 自然な落下の実装
      setBoard(resultBoard);

      // 数ミリ秒のディレイを持たせてから落下後の盤面を描画
      setTimeout(() => {
        const droppedBoard = dropBlocks(resultBoard);
        setBoard(droppedBoard);
      }, 50); 
    }
  };

  // --- 見た目の設定 ---
  const getBlockColor = (value) => {
    switch (value) {
      case 1: return '#ff4757'; // 赤
      case 2: return '#1e90ff'; // 青
      case 3: return '#2ed573'; // 緑
      case 4: return '#ffa502'; // 黄
      default: return 'transparent'; // 空(0)
    }
  };

  if (board.length === 0) return null;

  return (
    // 🌟 全体をダーク背景に
    <div className="puzzle-screen" style={styles.screenContainer}>
      
      {/* 🌟 左上のホームボタン */}
      <div 
        onClick={onBack} 
        style={styles.backButton}
      >
        ← HOME
      </div>

      {/* 👑 ヘッダー */}
      <div style={styles.header}>
        <div style={styles.timerDisplay}>
          ⏱ {formatTime(timeLeft)}
        </div>
        
        <div style={styles.infoDisplay}>
          <div style={styles.scoreText}>SCORE: {score}</div>
          <div style={styles.bombText}>💣: {bombCount}</div>
        </div>
      </div>

      {/* 🧩 8x8のグリッド（盤面）エリア */}
      <div style={{
        ...styles.boardPanel,
        opacity: isGameOver ? 0.3 : 1
      }}>
        {board.map((row, y) => 
          row.map((value, x) => {
            // ボムの爆発範囲（3x3）の判定
            const isHoveredBombRange = isBombMode && 
                                       hoveredBlock.x !== -1 && 
                                       hoveredBlock.y !== -1 &&
                                       Math.abs(hoveredBlock.x - x) <= 1 && 
                                       Math.abs(hoveredBlock.y - y) <= 1;

            return (
              <div
                key={`${y}-${x}`}
                onClick={() => handleBlockClick(x, y)}
                onMouseEnter={() => isBombMode && setHoveredBlock({ x, y })}
                onMouseLeave={() => isBombMode && setHoveredBlock({ x: -1, y: -1 })}
                style={{
                  ...styles.block,
                  backgroundColor: getBlockColor(value),
                  cursor: value === 0 || isGameOver ? 'default' : (isBombMode ? 'crosshair' : 'pointer'),
                  
                  // 🌟 視認性改善: ボムモード中は全体を暗く、ホバー範囲だけ明るく
                  opacity: isBombMode ? (isHoveredBombRange && value !== 0 ? 1 : 0.3) : 1,
                  
                  // 🌟 視認性改善: ホバー範囲の枠線とグローを「白」にする
                  border: isHoveredBombRange && value !== 0 && !isGameOver ? '3px solid #ffffff' : 'none',
                  boxShadow: isHoveredBombRange && value !== 0 && !isGameOver 
                    ? '0 0 15px rgba(255, 255, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.5)' 
                    : (value !== 0 ? 'inset 0 -5px 0 rgba(0,0,0,0.15)' : 'none'),
                  
                  // 🌟 視認性改善: ホバーした範囲を少し手前にフワッと浮かせる
                  transform: isHoveredBombRange && value !== 0 && !isGameOver ? 'scale(1.08)' : 'scale(1)',
                  zIndex: isHoveredBombRange ? 2 : 1, 
                }}
              />
            );
          })
        )}
      </div>

      <div style={styles.bombBtnContainer}>
        {/* 🌟 ボム発動ボタン */}
        <button 
          onClick={() => {
            if (bombCount > 0 && !isGameOver) {
              setIsBombMode(!isBombMode);
              if (isBombMode) setHoveredBlock({ x: -1, y: -1 }); 
            }
          }}
          disabled={isGameOver || bombCount <= 0}
          style={{
            ...styles.bombBtn,
            background: isBombMode ? 'linear-gradient(45deg, #ff4757, #ff6b81)' : 'linear-gradient(45deg, #1e90ff, #70a1ff)',
            boxShadow: isBombMode ? styles.bombBtnShadowRed : (bombCount > 0 && !isGameOver ? styles.bombBtnShadowBlue : 'none'),
            opacity: bombCount > 0 && !isGameOver ? 1 : 0.5,
            cursor: bombCount > 0 && !isGameOver ? 'pointer' : 'not-allowed',
          }}
        >
          {isBombMode ? '💣 落とす場所をタップ！' : `💣 ボムを使う`}
        </button>
      </div>
      
      {/* 🏁 ゲームオーバー時のオーバーレイ表示 */}
      {isGameOver && (
        <div style={styles.gameOverOverlay}>
          <div style={styles.gameOverPanel}>
            <h1 style={styles.timeUpText}>TIME UP!</h1>
            <h2 style={styles.finalScoreText}>Score: {score}</h2>
            <button 
              onClick={onBack} 
              style={styles.goHomeBtn}
            >
              ホームへ戻る
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}

// --- インラインスタイル定義 (ネオン・ダークテーマ) ---
const styles = {
  screenContainer: {
    backgroundColor: '#0a0e17', color: '#f1f2f6', fontFamily: 'sans-serif',
    position: 'relative', minHeight: '100vh',
    display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px',
  },
  backButton: {
    position: 'absolute', top: '20px', left: '20px',
    fontSize: '18px', fontWeight: 'bold', color: '#f1f2f6', cursor: 'pointer',
    opacity: 0.8, transition: 'opacity 0.2s',
  },
  header: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px',
    marginBottom: '20px', width: '90%', maxWidth: '600px',
  },
  timerDisplay: {
    fontSize: '64px', fontWeight: 'bold', color: '#1e90ff', 
    textShadow: '0 0 10px rgba(30, 144, 255, 0.7), 0 0 20px rgba(30, 144, 255, 0.5)',
  },
  infoDisplay: {
    display: 'flex', flexDirection: 'column', gap: '5px',
  },
  scoreText: {
    fontSize: '28px', fontWeight: 'bold', color: '#1e90ff',
    textShadow: '0 0 5px rgba(30, 144, 255, 0.7)',
  },
  bombText: {
    fontSize: '28px', fontWeight: 'bold', color: '#f1f2f6',
    textShadow: '0 0 5px rgba(241, 242, 246, 0.7)',
  },
  boardPanel: {
    display: 'grid', gridTemplateColumns: `repeat(${COLS}, 50px)`, gap: '6px',
    justifyContent: 'center', padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    borderRadius: '16px', width: 'fit-content', border: '3px solid #1e90ff', 
    boxShadow: '0 0 15px rgba(30, 144, 255, 0.5), inset 0 0 10px rgba(30, 144, 255, 0.3)', 
    transition: 'opacity 0.3s ease-in-out, border-color 0.3s',
  },
  block: {
    width: '50px', height: '50px', borderRadius: '10px',
    // 🌟 変更: opacity や transform など、すべてのアニメーションを滑らかにする
    transition: 'all 0.15s ease-out',
  },
  bombBtnContainer: {
    marginTop: '25px', marginBottom: '30px',
  },
  bombBtn: {
    padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', color: 'white',
    border: 'none', borderRadius: '12px', transition: 'all 0.1s ease-in-out',
  },
  bombBtnShadowBlue: '0 0 10px rgba(30, 144, 255, 0.7), 0 0 20px rgba(30, 144, 255, 0.5)',
  bombBtnShadowRed: '0 0 10px rgba(255, 71, 87, 0.7), 0 0 20px rgba(255, 71, 87, 0.5)',
  
  gameOverOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  gameOverPanel: {
    backgroundColor: 'rgba(10, 14, 23, 0.95)', border: '3px solid #ff4757', 
    padding: '40px', borderRadius: '20px', textAlign: 'center',
    boxShadow: '0 0 20px rgba(255, 71, 87, 0.5)',
  },
  timeUpText: {
    fontSize: '64px', margin: '0 0 15px 0', color: '#ff4757', 
    textShadow: '0 0 10px rgba(255, 71, 87, 0.7), 0 0 20px rgba(255, 71, 87, 0.5)',
  },
  finalScoreText: {
    fontSize: '32px', margin: '0 0 30px 0', color: '#f1f2f6',
    textShadow: '0 0 5px rgba(241, 242, 246, 0.7)',
  },
  goHomeBtn: {
    padding: '12px 24px', fontSize: '18px', fontWeight: 'bold',
    backgroundColor: '#1e90ff', color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', boxShadow: '0 0 10px rgba(30, 144, 255, 0.7)',
  },
};