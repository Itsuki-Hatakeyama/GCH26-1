import React, { useState, useEffect } from 'react';

import {
  createBoard,
  removeBlocks,
  dropBlocks,
  calculateScore,
  activateBomb,
  COLS
} from '../logic/puzzle';

// 🌟 【追加】エフェクト用のモジュールをインポート
import { particleEngine } from '../effects/particles';
import { shakeScreen } from '../effects/animations';
import { playSound } from '../effects/audio';

// 🌟 App.jsから「ホームに戻る関数(onBack)」と「ログイン中のユーザーID(userId)」を受け取る！
export default function PuzzleBoard({ onBack, userId }) {
  // --- 状態（State）の管理 ---
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  
  // 🌟 APIから取得するまで一旦0にしておく
  const [bombCount, setBombCount] = useState(0); 
  const [isBombMode, setIsBombMode] = useState(false);

  // ⏱ 2分間(120秒)のスコアアタック用タイマー
  const [timeLeft, setTimeLeft] = useState(120); 
  const [isGameOver, setIsGameOver] = useState(false);

  // ボム使用時のホバー範囲を可視化するためのState
  const [hoveredBlock, setHoveredBlock] = useState({ x: -1, y: -1 });

  // 🌟 画面が開いた瞬間の処理（初期盤面生成 ＆ ボム所持数の取得）
  useEffect(() => {
    setBoard(createBoard());

    // 🌟 【追加】画面ロード時にパーティクルエンジン（Canvas）を起動
    particleEngine.init();

    // 🚀 大翔さんのAPI④: アイテム所持数の確認
    const fetchInventory = async () => {
      // ユーザーIDがない（未ログイン）場合はスキップ
      if (!userId) return; 

      try {
        const response = await fetch(`http://localhost:5000/api/user/inventory?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          // ※バックエンドのレスポンス名に合わせて変更してください（例: data.bombs など）
          // 今回は仮で data.bomb_count としています
          if (data.bomb_count !== undefined) {
            setBombCount(data.bomb_count);
            console.log(`💣 ボム所持数を取得しました: ${data.bomb_count}個`);
          }
        } else {
          console.error('⚠️ ボム所持数の取得に失敗しました:', response.status);
        }
      } catch (error) {
        console.error('🔌 バックエンドと通信できませんでした:', error);
        // 通信エラー時は、テスト用に3個付与しておく（本番では消してOK）
        setBombCount(3); 
      }
    };

    fetchInventory();
  }, [userId]);

  // ⏱ タイマーのカウントダウン ＆ ゲーム終了時のスコア送信処理
  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerId); // クリーンアップ
    } else if (timeLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      
      // 🚀 大翔さんのAPI⑤: スコア送信
      const sendScoreToBackend = async () => {
        if (!userId) {
          console.log("⚠️ ゲストプレイのためスコアは送信されません");
          return;
        }

        try {
          const response = await fetch('http://localhost:5000/api/game/score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // 🌟 APIの仕様書通り、user_id と score を送信！
            body: JSON.stringify({ 
              user_id: userId, 
              score: score 
            }),
          });

          if (response.ok) {
            console.log(`🔥 ユーザー[${userId}]のスコア ${score} の送信に成功しました！`);
          } else {
            console.error('⚠️ スコア送信エラー:', response.status);
          }
        } catch (error) {
          console.error('🔌 バックエンドと通信できませんでした:', error);
        }
      };

      sendScoreToBackend();
    }
  }, [timeLeft, isGameOver, score, userId]);

  // ⏱ 時間を MM:SS 形式 (例: 2:00) に変換する関数
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- 見た目の設定 ---
  const getBlockColor = (value) => {
    switch (value) {
      case 1: return '#ff4757';
      case 2: return '#1e90ff';
      case 3: return '#2ed573';
      case 4: return '#ffa502';
      default: return 'transparent';
    }
  };

  // --- クリックされた時の処理 ---
  // 🌟 【変更】クリックイベント情報(e)を受け取れるように引数を追加
  const handleBlockClick = (e, x, y) => {
    if (!board || board.length === 0 || isGameOver) return;
    if (!isBombMode && board[y][x] === 0) return;

    // 🌟 【追加】演出のために、クリックしたブロックの「色」と「ボム使用フラグ」を記憶しておく
    const targetColor = getBlockColor(board[y][x]);
    const wasBombAction = isBombMode;

    let resultBoard;
    let removedCount = 0;

    // 💣 ボムモードがONの場合
    if (isBombMode) {
      const result = activateBomb(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
      
      setBombCount(prev => prev - 1);
      setIsBombMode(false);
      setHoveredBlock({ x: -1, y: -1 });
    } 
    // 👆 通常のクリック（同色消し）の場合
    else {
      const result = removeBlocks(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
    }

    // ★ ブロックが消えた場合の処理
    if (removedCount > 0) {
      const earnedScore = calculateScore(removedCount);
      setScore(prevScore => prevScore + earnedScore);

      // 🌟🌟🌟 【追加】ここから「気持ちいい演出」の発動！ 🌟🌟🌟
      
      // 1. クリックされた正確な画面座標を取得（要素の中心点を計算）
      const rect = e.target.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      // 2. ボムか通常かで演出を分岐
      if (wasBombAction) {
        playSound('bomb'); // 💥 爆発音
        shakeScreen(true); // 💥 激しい画面揺れ
        particleEngine.emit(clickX, clickY, targetColor, true); // 💥 大爆発エフェクト
      } else {
        playSound('pop'); // ✨ ポップ音
        shakeScreen(false); // ✨ 軽い画面揺れ
        particleEngine.emit(clickX, clickY, targetColor, false); // ✨ 星が弾けるエフェクト
      }
      
      // 🌟🌟🌟 【追加】ここまで 🌟🌟🌟

      setBoard(resultBoard);
      setTimeout(() => {
        const droppedBoard = dropBlocks(resultBoard);
        setBoard(droppedBoard);
      }, 50); 
    }
  };

  if (board.length === 0) return null;

  return (
    // 🌟 【変更】一番外側のdivに className="game-container" を追加（Anime.jsがこのクラス名を探して揺らします）
    <div className="puzzle-screen game-container" style={styles.screenContainer}>
      
      <div onClick={onBack} style={styles.backButton}>
        ← HOME
      </div>

      <div style={styles.header}>
        <div style={styles.timerDisplay}>
          ⏱ {formatTime(timeLeft)}
        </div>
        
        <div style={styles.infoDisplay}>
          <div style={styles.scoreText}>SCORE: {score}</div>
          <div style={styles.bombText}>💣: {bombCount}</div>
        </div>
      </div>

      <div style={{
        ...styles.boardPanel,
        opacity: isGameOver ? 0.3 : 1
      }}>
        {/* 🌟 【変更】ブロック描画部分の onClick に e(イベント) を渡すように修正 */}
        {board.map((row, y) => 
          row.map((value, x) => {
            const isHoveredBombRange = isBombMode && 
                                       hoveredBlock.x !== -1 && 
                                       hoveredBlock.y !== -1 &&
                                       Math.abs(hoveredBlock.x - x) <= 1 && 
                                       Math.abs(hoveredBlock.y - y) <= 1;

            return (
              <div
                key={`${y}-${x}`}
                onClick={(e) => handleBlockClick(e, x, y)} // 👈 eを渡す
                onMouseEnter={() => isBombMode && setHoveredBlock({ x, y })}
                onMouseLeave={() => isBombMode && setHoveredBlock({ x: -1, y: -1 })}
                style={{
                  ...styles.block,
                  backgroundColor: getBlockColor(value),
                  cursor: value === 0 || isGameOver ? 'default' : (isBombMode ? 'crosshair' : 'pointer'),
                  
                  opacity: isBombMode ? (isHoveredBombRange && value !== 0 ? 1 : 0.3) : 1,
                  border: isHoveredBombRange && value !== 0 && !isGameOver ? '3px solid #ffffff' : 'none',
                  boxShadow: isHoveredBombRange && value !== 0 && !isGameOver 
                    ? '0 0 15px rgba(255, 255, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.5)' 
                    : (value !== 0 ? 'inset 0 -5px 0 rgba(0,0,0,0.15)' : 'none'),
                  transform: isHoveredBombRange && value !== 0 && !isGameOver ? 'scale(1.08)' : 'scale(1)',
                  zIndex: isHoveredBombRange ? 2 : 1, 
                }}
              />
            );
          })
        )}
      </div>

      <div style={styles.bombBtnContainer}>
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
      
      {isGameOver && (
        <div style={styles.gameOverOverlay}>
          <div style={styles.gameOverPanel}>
            <h1 style={styles.timeUpText}>TIME UP!</h1>
            <h2 style={styles.finalScoreText}>Score: {score}</h2>
            <button onClick={onBack} style={styles.goHomeBtn}>
              ホームへ戻る
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}

// stylesオブジェクトは既存のまま変更なし
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