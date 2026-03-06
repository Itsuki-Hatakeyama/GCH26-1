import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const FOCUS_TIME = 5; 
  const BREAK_TIME = 3; 
  
  const [seconds, setSeconds] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // 現在のモードの合計時間を取得
  const totalTime = isBreak ? BREAK_TIME : FOCUS_TIME;
  // 進捗率を計算（0〜100%）
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

  const themeClass = isBreak ? 'theme-break' : 'theme-focus';

  return (
    <div className={`container ${themeClass}`}>
      {/* style={{ '--progress': `${progress}%` }} 
         という部分で、CSSに現在の進捗率を渡しています
      */}
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