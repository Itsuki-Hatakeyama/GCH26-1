// src/logic/puzzle.js

export const ROWS = 8;
export const COLS = 8;
export const COLORS = [1, 2, 3, 4]; // 1:赤, 2:青, 3:緑, 4:黄

// 🌟 ブロックに名前(ID)をつけるための関数
const generateId = () => Math.random().toString(36).substring(2, 9);

export function createBoard() {
  const board = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      row.push({
        id: generateId(),
        color: Math.floor(Math.random() * COLORS.length) + 1
      });
    }
    board.push(row);
  }
  return board;
}

export function removeBlocks(board, startX, startY) {
  const targetColor = board[startY][startX].color;
  
  if (targetColor === 0) return { newBoard: board, removedCount: 0 };

  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const connectedBlocks = [];

  function dfs(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    if (visited[y][x]) return;
    if (board[y][x].color !== targetColor) return; // 色を判定

    visited[y][x] = true;
    connectedBlocks.push({ x, y });

    dfs(x, y - 1);
    dfs(x, y + 1);
    dfs(x - 1, y);
    dfs(x + 1, y);
  }

  dfs(startX, startY);

  if (connectedBlocks.length >= 3) {
    const newBoard = board.map(row => [...row]);
    connectedBlocks.forEach(block => {
      // 🌟 IDは残したまま、色だけ0(透明)にする！
      newBoard[block.y][block.x] = { ...newBoard[block.y][block.x], color: 0 };
    });
    return { newBoard, removedCount: connectedBlocks.length };
  }

  return { newBoard: board, removedCount: 0 };
}

export function dropBlocks(board) {
  const newBoard = board.map(row => [...row]);

  for (let x = 0; x < COLS; x++) {
    let columnBlocks = [];
    
    // 空じゃないブロックを収集
    for (let y = ROWS - 1; y >= 0; y--) {
      if (newBoard[y][x].color !== 0) {
        columnBlocks.push(newBoard[y][x]);
      }
    }

    // 下から詰めて、足りない分は新しいIDでブロック生成
    for (let y = ROWS - 1; y >= 0; y--) {
      if (columnBlocks.length > 0) {
        newBoard[y][x] = columnBlocks.shift();
      } else {
        newBoard[y][x] = {
          id: generateId(),
          color: Math.floor(Math.random() * COLORS.length) + 1
        };
      }
    }
  }

  return newBoard;
}

// 🌟 コンボ機能追加（パターンA）：comboCountを受け取って倍率をかける
export function calculateScore(removedCount, comboCount = 0) {
  if (removedCount < 3) return 0;
  
  // 基本スコア
  const baseScore = removedCount * removedCount * 10;
  
  // 1コンボにつき +0.2倍（最大5倍まで）
  const multiplier = Math.min(1 + (comboCount * 0.2), 5.0);
  
  return Math.floor(baseScore * multiplier);
}

export function activateBomb(board, centerX, centerY) {
  const newBoard = board.map(row => [...row]);
  let removedCount = 0;

  for (let y = centerY - 1; y <= centerY + 1; y++) {
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        if (newBoard[y][x].color !== 0) {
          // 🌟 ここでもIDは残す
          newBoard[y][x] = { ...newBoard[y][x], color: 0 };
          removedCount++;
        }
      }
    }
  }

  return { newBoard, removedCount };
}