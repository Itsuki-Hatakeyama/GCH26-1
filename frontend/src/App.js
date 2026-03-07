import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 画面遷移用の状態（'home' または 'timer'）
  const [view, setView] = useState('home');

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

  // ① ホーム画面
  if (view === 'home') {
    return (
      <div className="container theme-home">
        <div className="home-content">
          <h1 className="app-title">PUZZLE & DRYOKU's</h1>
          <p className="app-subtitle">集中してランクを上げよう</p>
          <div className="menu-group">
            <button className="btn-main" onClick={() => setView('timer')}>
              START MISSION
            </button>
            <button className="btn-sub">RANKING</button>
          </div>
        </div>
      </div>
    );
  }

  // ② タイマー画面
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