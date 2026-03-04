// GCH26-1/logic/puzzle.js

const ROWS = 8;
const COLS = 8;
const COLORS = [1, 2, 3, 4]; // 1:赤, 2:青, 3:緑, 4:黄 (0は計算用の空マス)

/**
 * 1. 盤面の初期化
 * 8x8のランダムな数字の2次元配列を生成します。
 */
export function createBoard() {
  const board = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      // 1〜4のランダムな数字をセット
      row.push(Math.floor(Math.random() * COLORS.length) + 1);
    }
    board.push(row);
  }
  return board;
}

/**
 * 2. 消去判定（Flood Fill / DFS）
 * クリックされた(x, y)から同色ブロックを探索し、0（空）にします。
 * 戻り値: { newBoard: 更新後の盤面, removedCount: 消えた数 }
 */
export function removeBlocks(board, startX, startY) {
  const targetColor = board[startY][startX];
  
  // 既に空(0)の場所をクリックした場合は何もしない
  if (targetColor === 0) return { newBoard: board, removedCount: 0 };

  // 探索済みかどうかを記録する8x8配列
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const connectedBlocks = [];

  // 深さ優先探索（DFS）の内部関数
  function dfs(x, y) {
    // 盤面外ならストップ
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    // 既に見たマスならストップ
    if (visited[y][x]) return;
    // 違う色ならストップ
    if (board[y][x] !== targetColor) return;

    // 条件をクリアしたら「つながっているブロック」として記録
    visited[y][x] = true;
    connectedBlocks.push({ x, y });

    // 上下左右を探索
    dfs(x, y - 1); // 上
    dfs(x, y + 1); // 下
    dfs(x - 1, y); // 左
    dfs(x + 1, y); // 右
  }

  // クリックされた座標から探索開始
  dfs(startX, startY);

  // トゥーンブラストの仕様：2個以上繋がっていないと消えない
  if (connectedBlocks.length >= 2) {
    // React用に盤面のディープコピー（複製）を作成
    const newBoard = board.map(row => [...row]);
    
    // 繋がっていた場所を 0（空） にする
    connectedBlocks.forEach(block => {
      newBoard[block.y][block.x] = 0;
    });
    
    // 消した数(removedCount)は、スコア計算やVFXの派手さの分岐に使えます！
    return { newBoard, removedCount: connectedBlocks.length };
  }

  // 2個未満なら消さずにそのまま返す
  return { newBoard: board, removedCount: 0 };
}

/**
 * 3. 重力（落下）と新しいブロックの補充
 * 0（空）になった部分に上のブロックを落とし、一番上には新しいブロックを生成します。
 */
export function dropBlocks(board) {
  const newBoard = board.map(row => [...row]); // コピーを作成

  // 列（カラム）ごとに下から見ていく
  for (let x = 0; x < COLS; x++) {
    let columnBlocks = []; // その列に残っているブロックを保持する配列
    
    // 下の行から上に向かって、0以外のブロックを回収
    for (let y = ROWS - 1; y >= 0; y--) {
      if (newBoard[y][x] !== 0) {
        columnBlocks.push(newBoard[y][x]);
      }
    }

    // 回収したブロックを下から順に詰め直す
    for (let y = ROWS - 1; y >= 0; y--) {
      if (columnBlocks.length > 0) {
        newBoard[y][x] = columnBlocks.shift();
      } else {
        // エンドレススコアアタック仕様：足りない上部は新しい色を降らせる
        newBoard[y][x] = Math.floor(Math.random() * COLORS.length) + 1;
      }
    }
  }

  return newBoard;
}