import React, { useState, useEffect } from 'react';

// ★変更点①：App.jsからログイン情報(currentUser)も受け取るようにします
export default function Timer({ onBack, currentUser }) {
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
        // ★変更点②：集中終了時の処理！ここでバックエンドに通信します
        const reportFinish = async () => {
          try {
            const response = await fetch('http://localhost:5000/api/pomodoro/finish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: currentUser?.id || 'user_123', // ログイン中のIDを送る
                study_minutes: 25 // ※今回はテスト用に25分勉強したことにして送ります
              })
            });
            const data = await response.json();
            
            if (data.status === 'success') {
              alert(`集中完了！ボムをゲットしました！（現在の所持数: ${data.reward.total_bombs_owned}個）\nゆっくり休憩しましょう☕️`);
            }
          } catch (error) {
            console.error('通信エラー:', error);
            alert('サーバーと通信できませんでしたが、休憩に入ります！（バックエンドは起動していますか？）');
          }
        };

        reportFinish(); // 通信を実行！

        setIsBreak(true);
        setSeconds(BREAK_TIME);
      } else {
        alert("休憩終了！さあ、始めましょう。");
        setIsBreak(false);
        setSeconds(FOCUS_TIME);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, isBreak, currentUser]); 
  // ★変更点③：useEffectの監視対象に currentUser を追加します

  const themeClass = isBreak ? 'theme-break' : 'theme-focus';

  return (
    <div className={`container ${themeClass}`}>
      <button className="btn-back" onClick={() => {
        setIsActive(false);
        onBack();
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