import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const FOCUS_TIME = 5; // 開発用：集中5秒
  const BREAK_TIME = 3; // 開発用：休憩3秒
  
  const [seconds, setSeconds] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false); // 休憩モードかどうか

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      
      if (!isBreak) {
        // 集中終了時
        console.log("【集中完了】サーバー送信:", { type: "work", status: "done" });
        alert("集中終了！休憩しましょう。");
        setIsBreak(true);
        setSeconds(BREAK_TIME);
      } else {
        // 休憩終了時
        console.log("【休憩完了】サーバー送信:", { type: "break", status: "done" });
        alert("休憩終了！さあ、始めましょう。");
        setIsBreak(false);
        setSeconds(FOCUS_TIME);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, isBreak]);

  // モードによってクラス名を使い分ける
  const themeClass = isBreak ? 'theme-break' : 'theme-focus';

  return (
    <div className={`container ${themeClass}`}>
      <div className="timer-card">
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