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
  
  const [bombCount, setBombCount] = useState(3); // TODO: 本番はポモドーロから受け取る
  const [isBombMode, setIsBombMode] = useState(false);

  // ⏱ 2分間(120秒)のスコアアタック用タイマー
  const [timeLeft, setTimeLeft] = useState(120); 
  const [isGameOver, setIsGameOver] = useState(false);

  // 画面が開いた瞬間に、初期盤面を生成する
  useEffect(() => {
    setBoard(createBoard());
  }, []);

  // ⏱ タイマーのカウントダウン処理
  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerId); // クリーンアップ
    } else if (timeLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      
      // 🚀 大翔さん（バックエンド）の出番！
      // TODO: ここでPythonのAPI（POST /api/score）を叩いてスコアを送信する
      console.log(`ゲーム終了！最終スコア: ${score} を送信します`);
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

      // ✨ いつきさん（VFX）の出番！
      // TODO: ここで playExplosionEffect(x, y) を呼んで画面を揺らす！
    } 
    // 👆 通常のクリック（同色消し）の場合
    else {
      const result = removeBlocks(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;

      // ✨ いつきさん（VFX）の出番！
      // TODO: removedCount が 5以上 だったら派手なエフェクトにする等！
    }

    // 1個以上消えた場合（ボムまたは2個以上同色）
    if (removedCount > 0) {
      // スコア計算＆加算
      const earnedScore = calculateScore(removedCount);
      setScore(prevScore => prevScore + earnedScore);

      // 空いた隙間に重力でブロックを落として補充
      const droppedBoard = dropBlocks(resultBoard);
      
      // 画面を更新！
      setBoard(droppedBoard);
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
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', color: 'white', position: 'relative', minHeight: '100vh', paddingTop: '20px' }}>
      
      {/* 🌟 左上のホームボタン（onClickをonBackに変更！） */}
      <button 
        onClick={onBack} 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px 15px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: '#dfe4ea',
          color: '#2f3542',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 0px rgba(0,0,0,0.1)',
          transition: 'transform 0.1s'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(4px)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        ⬅️ ホーム
      </button>

      {/* 👑 ヘッダー（スコア・タイマー・アイテム表示エリア） */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center' }}>
        <h2 style={{ fontSize: '32px', margin: 0, textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
          ⏱ {formatTime(timeLeft)}
        </h2>
        <h2 style={{ fontSize: '36px', margin: 0, textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
          SCORE: {score}
        </h2>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {/* ボム発動ボタン */}
        <button 
          onClick={() => {
            if (bombCount > 0 && !isGameOver) setIsBombMode(!isBombMode);
          }}
          disabled={isGameOver || bombCount <= 0}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: isBombMode ? '#ff4757' : (bombCount > 0 && !isGameOver ? '#ffa502' : '#747d8c'),
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: bombCount > 0 && !isGameOver ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 0px rgba(0,0,0,0.2)',
            transform: isBombMode ? 'scale(0.95)' : 'scale(1)',
            transition: 'all 0.1s'
          }}
        >
          {isBombMode ? '💣 どこに落とす？ (タップでキャンセル)' : `💣 ボムを使う (残り: ${bombCount}個)`}
        </button>
      </div>
      
      {/* 🧩 8x8のグリッド（盤面）エリア */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 50px)`,
        gap: '6px',
        justifyContent: 'center',
        margin: '0 auto',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        width: 'fit-content',
        opacity: isGameOver ? 0.5 : 1 // ゲームオーバー時は盤面を暗くする
      }}>
        {board.map((row, y) => 
          row.map((value, x) => (
            <div
              key={`${y}-${x}`}
              onClick={() => handleBlockClick(x, y)}
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: getBlockColor(value),
                borderRadius: '10px',
                cursor: value === 0 || isGameOver ? 'default' : (isBombMode ? 'crosshair' : 'pointer'),
                boxShadow: value !== 0 ? 'inset 0 -5px 0 rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.1s ease-in-out',
                transform: isBombMode && value !== 0 && !isGameOver ? 'scale(0.9)' : 'scale(1)',
                border: isBombMode && value !== 0 && !isGameOver ? '2px solid #ff4757' : 'none'
              }}
            />
          ))
        )}
      </div>

      {/* 🏁 ゲームオーバー時のオーバーレイ表示 */}
      {isGameOver && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#2f3542',
          padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10
        }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#ff4757' }}>TIME UP!</h1>
          <h2 style={{ fontSize: '32px', margin: '0 0 20px 0' }}>Score: {score}</h2>
          <button 
            onClick={onBack} // 🌟 ここも onBack に変更！
            style={{
              padding: '12px 24px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#1e90ff',
              color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer',
              boxShadow: '0 4px 0px rgba(0,0,0,0.2)'
            }}
          >
            ホームへ戻る
          </button>
        </div>
      )}
      
    </div>
  );
}