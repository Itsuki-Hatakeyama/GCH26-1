import React, { useState, useEffect } from 'react';
// 新妻さんが作った最強のロジックをインポート！
// ※もし「ファイルが見つからない」というエラーが出たら、../../../ の数を増やしたり減らしたりして調整してください。
import {
  createBoard,
  removeBlocks,
  dropBlocks,
  calculateScore,
  useBomb,
  ROWS,
  COLS
} from '../../../logic/puzzle';

export default function PuzzleBoard() {
  // --- 状態（State）の管理 ---
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  
  // ボムの所持数と、ボム使用モードのオンオフ状態（一旦テスト用に3個持たせておきます）
  const [bombCount, setBombCount] = useState(3); 
  const [isBombMode, setIsBombMode] = useState(false);

  // 画面が開いた瞬間に、初期盤面を生成する
  useEffect(() => {
    setBoard(createBoard());
  }, []);

  // --- クリックされた時の処理 ---
  const handleBlockClick = (x, y) => {
    if (!board || board.length === 0) return;

    let resultBoard;
    let removedCount = 0;

    // 💣 ボムモードがONの場合
    if (isBombMode) {
      const result = useBomb(board, x, y);
      resultBoard = result.newBoard;
      removedCount = result.removedCount;
      
      // ボムを1個消費して、モードを解除する
      setBombCount(prev => prev - 1);
      setIsBombMode(false);
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

      // 空いた隙間に重力でブロックを落として補充
      const droppedBoard = dropBlocks(resultBoard);
      
      // 画面を更新！
      setBoard(droppedBoard);
    }
  };

  // --- 見た目の設定 ---
  // 数字を色付きのブロックに変換する関数
  const getBlockColor = (value) => {
    switch (value) {
      case 1: return '#ff4757'; // 赤 (スイカみたいな色)
      case 2: return '#1e90ff'; // 青 (水色)
      case 3: return '#2ed573'; // 緑 (明るい緑)
      case 4: return '#ffa502'; // 黄 (オレンジ寄り)
      default: return 'transparent'; // 空(0)
    }
  };

  // 盤面が作られる一瞬の間は何も表示しない（エラー防止）
  if (board.length === 0) return null;

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', color: 'white' }}>
      
      {/* 👑 スコアとアイテム表示エリア */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '36px', margin: '0 0 15px 0', textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
          SCORE: {score}
        </h2>
        
        {/* ボム発動ボタン */}
        <button 
          onClick={() => {
            if (bombCount > 0) setIsBombMode(!isBombMode);
          }}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: isBombMode ? '#ff4757' : (bombCount > 0 ? '#ffa502' : '#747d8c'),
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: bombCount > 0 ? 'pointer' : 'not-allowed',
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
        gridTemplateColumns: `repeat(${COLS}, 50px)`, // 50pxのマスを8列
        gap: '6px',
        justifyContent: 'center',
        margin: '0 auto',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // 盤面の背景を少し暗く
        borderRadius: '16px',
        width: 'fit-content'
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
                borderRadius: '10px', // 少し丸みを持たせる
                cursor: value === 0 ? 'default' : (isBombMode ? 'crosshair' : 'pointer'),
                boxShadow: value !== 0 ? 'inset 0 -5px 0 rgba(0,0,0,0.15)' : 'none', // 立体感を出す
                transition: 'all 0.1s ease-in-out',
                // ボムモード中はブロックを少し小さくして、赤い枠線をつける演出
                transform: isBombMode && value !== 0 ? 'scale(0.9)' : 'scale(1)',
                border: isBombMode && value !== 0 ? '2px solid #ff4757' : 'none'
              }}
            />
          ))
        )}
      </div>
      
    </div>
  );
}