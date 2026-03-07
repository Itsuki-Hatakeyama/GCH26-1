// GCH26-1/logic/puzzle.js

export const ROWS = 8;
export const COLS = 8;
export const COLORS = [1, 2, 3, 4]; // 1:赤, 2:青, 3:緑, 4:黄 (0は計算用の空マス)

/**
 * 1. 盤面の初期化
 * 8x8のランダムな数字の2次元配列を生成します。
 */
export function createBoard() {
  const board = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      row.push(Math.floor(Math.random() * COLORS.length) + 1);
    }
    board.push(row);
  }
  return board;
}

/**
 * 2. 消去判定（Flood Fill / DFS）
 * クリックされた(x, y)から同色ブロックを探索し、0（空）にします。
 */
export function removeBlocks(board, startX, startY) {
  const targetColor = board[startY][startX];
  
  if (targetColor === 0) return { newBoard: board, removedCount: 0 };

  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const connectedBlocks = [];

  function dfs(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    if (visited[y][x]) return;
    if (board[y][x] !== targetColor) return;

    visited[y][x] = true;
    connectedBlocks.push({ x, y });

    dfs(x, y - 1);
    dfs(x, y + 1);
    dfs(x - 1, y);
    dfs(x + 1, y);
  }

  dfs(startX, startY);

  if (connectedBlocks.length >= 2) {
    const newBoard = board.map(row => [...row]);
    connectedBlocks.forEach(block => {
      newBoard[block.y][block.x] = 0;
    });
    return { newBoard, removedCount: connectedBlocks.length };
  }

  return { newBoard: board, removedCount: 0 };
}

/**
 * 3. 重力（落下）と新しいブロックの補充
 * 0（空）になった部分に上のブロックを落とし、一番上には新しいブロックを生成します。
 */
export function dropBlocks(board) {
  const newBoard = board.map(row => [...row]);

  for (let x = 0; x < COLS; x++) {
    let columnBlocks = [];
    
    for (let y = ROWS - 1; y >= 0; y--) {
      if (newBoard[y][x] !== 0) {
        columnBlocks.push(newBoard[y][x]);
      }
    }

    for (let y = ROWS - 1; y >= 0; y--) {
      if (columnBlocks.length > 0) {
        newBoard[y][x] = columnBlocks.shift();
      } else {
        newBoard[y][x] = Math.floor(Math.random() * COLORS.length) + 1;
      }
    }
  }

  return newBoard;
}