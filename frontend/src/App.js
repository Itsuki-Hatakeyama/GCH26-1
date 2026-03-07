import React, { useState, useEffect } from 'react';
import './App.css';

// 開発用：8x8のダミー盤面を作る関数（枠の見た目確認用です）
const createDummyBoard = () => {
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => Math.floor(Math.random() * 4) + 1)
  );
};

function App() {
  const [view, setView] = useState('home');
  
// ▼ ここを変更！ 
  // まだ動かさない（枠だけ作る）ので、useStateではなく固定の変数にします。
  // これで「setBoardが使われてないよ！」というワーニングが消滅します！
  const board = createDummyBoard();
  const score = 0;

  // --- タイマーのロジック（そのまま） ---
  const FOCUS_TIME = 15; 
  const BREAK_TIME = 13; 
  
  const [seconds, setSeconds] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const totalTime = isBreak ? BREAK_TIME : FOCUS_TIME;
  const progress = (seconds / totalTime) * 100;

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (!isBreak) {
        alert("集中終了！休憩しましょう。");
        setIsBreak(true);
        setSeconds(BREAK_TIME);
      } else {
        alert("休憩終了！さあ、始めましょう。");
        setIsBreak(false);
        setSeconds(FOCUS_TIME);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, isBreak]);

  // --- 画面の出し分け ---

// --- 画面の出し分け ---

  // ① ホーム画面
  if (view === 'home') {
    return (
      <div className="container theme-home">
        <div className="home-content">
          <h1 className="app-title">FOCUS QUEST</h1>
          <p className="app-subtitle">集中してランクを上げよう</p>
          <div className="menu-group">
            <button className="btn-main" onClick={() => setView('timer')}>START MISSION</button>
            <button className="btn-sub" onClick={() => setView('ranking')}>RANKING</button>
            
            {/* ★修正ポイント：ホームにゲーム画面へのテストボタンを追加 */}
            <button className="btn-sub" style={{marginTop: '10px', borderColor: '#8b5cf6', color: '#c4b5fd'}} onClick={() => setView('game')}>
              🎮 PLAY GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ② ランキング画面（そのまま）
if (view === 'ranking') {
    return (
      <div className="container theme-ranking">
        {/* 左上にホームへ戻るボタン */}
        <button className="btn-back" onClick={() => setView('home')}>
          ← HOME
        </button>
        
        <div className="ranking-content">
          <h1 className="ranking-title">🏆 RANKING</h1>
          <p className="ranking-subtitle">世界のフォーカスマスター達</p>

          <div className="ranking-board">
            <div className="ranking-item rank-1">
              <span className="rank-num">1</span>
              <span className="rank-name">Player_Zero</span>
              <span className="rank-score">999 hrs</span>
            </div>
            <div className="ranking-item rank-2">
              <span className="rank-num">2</span>
              <span className="rank-name">Focus_Ninja</span>
              <span className="rank-score">850 hrs</span>
            </div>
            <div className="ranking-item rank-3">
              <span className="rank-num">3</span>
              <span className="rank-name">Time_Hacker</span>
              <span className="rank-score">720 hrs</span>
            </div>
            <div className="ranking-item">
              <span className="rank-num">4</span>
              <span className="rank-name">React_Beginner</span>
              <span className="rank-score">450 hrs</span>
            </div>
            
            {/* 自分の現在の結果（仮） */}
            <div className="ranking-item my-rank">
              <span className="rank-num">99+</span>
              <span className="rank-name">YOU</span>
              <span className="rank-score">0 hrs</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ★新規追加：③ ゲーム画面（枠だけ）
  if (view === 'game') {
    return (
      <div className="container theme-game">
        <button className="btn-back" onClick={() => setView('home')}>← HOME</button>
        
        <div className="game-layout">
          {/* ゲームのヘッダー（スコアなど） */}
          <div className="game-header">
            <div className="score-box">
              <span className="score-label">SCORE</span>
              <span className="score-value">{score}</span>
            </div>
          </div>

          {/* 8x8のパズル盤面 */}
          <div className="game-board">
            {board.map((row, y) => (
              row.map((colorValue, x) => (
                <div 
                  key={`${x}-${y}`} 
                  className={`block color-${colorValue}`}
                  // クリックイベントの準備（今はログが出るだけ）
                  onClick={() => console.log(`Clicked x:${x}, y:${y}, color:${colorValue}`)}
                ></div>
              ))
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ④ タイマー画面
  const themeClass = isBreak ? 'theme-break' : 'theme-focus';

  return (
    <div className={`container ${themeClass}`}>
      {/* 左上にホームへ戻るボタンを追加 */}
      <button className="btn-back" onClick={() => {
        setView('home');
        setIsActive(false); // ホームに戻る時はタイマーを一時停止
      }}>
        ← HOME
      </button>

      <div className="timer-card" style={{ '--progress': `${progress}%` }}>
        <h1 className="status-label">
          {isBreak ? "☕️ RELAX" : "🎯 FOCUS"}
        </h1>
        <div className="timer-display">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </div>
        <div className="button-group">
          <button className="btn start" onClick={() => setIsActive(!isActive)}>
            {isActive ? 'PAUSE' : 'START'}
          </button>
          <button className="btn reset" onClick={() => {
            setIsActive(false); 
            setSeconds(isBreak ? BREAK_TIME : FOCUS_TIME);
          }}>
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;