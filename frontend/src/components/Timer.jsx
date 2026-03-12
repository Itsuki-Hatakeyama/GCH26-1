import React, { useState, useEffect } from 'react';

export default function Timer({ onBack, currentUser }) {
  // ★ テスト用時間（本番は 25 * 60 などに戻してください）
  const FOCUS_TIME = 5; 
  const BREAK_TIME = 5;

  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  
  const [bombs, setBombs] = useState(0); 
  const [completedCount, setCompletedCount] = useState(0); 

  const API_BASE = "http://127.0.0.1:5000";
  
  const accentColor = isBreak ? '#2ed573' : '#38bdf8';
  const totalTime = isBreak ? BREAK_TIME : FOCUS_TIME;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/inventory?user_id=${currentUser.id}`);
        const data = await response.json();
        setBombs(data.items.bomb);
      } catch (error) {
        console.error("在庫取得エラー:", error);
      }
    };
    fetchInventory();
  }, [currentUser.id]);

  // カウントダウン処理
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // 0になった瞬間にゲージが消えるのを見せるため、1秒待ってから次へ進む
      interval = setTimeout(() => {
        handleTimerComplete();
      }, 1000); 
    } else {
      clearInterval(interval);
      clearTimeout(interval);
    }
    return () => {
      clearInterval(interval);
      clearTimeout(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft, isBreak]);

  const handleTimerComplete = async () => {
    setIsActive(false);

    if (!isBreak) {
      try {
        const response = await fetch(`${API_BASE}/api/pomodoro/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id, study_minutes: 25 })
        });
        const data = await response.json();
        
        if (response.ok) {
          setBombs(data.reward.total_bombs_owned); 
          setCompletedCount(prev => prev + 1); 
          alert("ミッション完了！ボムを1個獲得しました。休憩に移行します。");
        }
      } catch (error) {
        alert("データの保存に失敗しました。");
      }
      setIsBreak(true);
      setTimeLeft(BREAK_TIME);
    } else {
      alert("休憩終了！次のミッションを開始します。");
      setIsBreak(false);
      setTimeLeft(FOCUS_TIME);
    }
  };

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeLeft / totalTime) * 100;

  return (
    <div className="container theme-home" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      position: 'relative'
    }}>
      
      {/* ★ ご指定のシンプルなボタン構造に変更 */}
      <button className="btn-back" onClick={onBack}>← HOME</button>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: accentColor, letterSpacing: '0.3em', fontSize: '1.2rem', fontFamily: 'monospace', transition: 'color 0.5s' }}>
          {isBreak ? '-- CURRENT MISSION: RELAX --' : '-- CURRENT MISSION: FOCUS --'}
        </h2>
      </div>

      <div style={{
        fontSize: '12rem',
        fontFamily: 'Courier New, monospace',
        fontWeight: '900',
        color: 'white',
        textShadow: `0 0 30px ${accentColor}`,
        lineHeight: '1',
        marginBottom: '20px',
        transition: 'text-shadow 0.5s'
      }}>
        {formatTime()}
      </div>

      <div style={{
        width: '600px',
        maxWidth: '90%',
        height: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: '50px',
        borderRadius: '2px',
        overflow: 'hidden',
        boxShadow: `0 0 10px ${accentColor}33`
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`, 
          backgroundColor: accentColor, 
          boxShadow: `0 0 15px ${accentColor}`,
          transition: 'width 1s linear, background-color 0.5s' 
        }}></div>
      </div>

      <div style={{
        display: 'flex',
        gap: '40px',
        marginBottom: '50px',
        backgroundColor: `${accentColor}11`,
        padding: '20px 40px',
        border: `1px solid ${accentColor}33`,
        borderRadius: '4px',
        transition: 'all 0.5s'
      }}>
        <div>
          <p style={{ fontSize: '12px', color: accentColor, margin: 0, transition: 'color 0.5s' }}>SESSIONS_DONE</p>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', color: 'white' }}>{completedCount}</p>
        </div>
        <div style={{ width: '1px', backgroundColor: `${accentColor}33` }}></div>
        <div>
          <p style={{ fontSize: '12px', color: '#ff4757', margin: 0 }}>BOMB_STOCK</p>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', color: '#ff4757', textShadow: '0 0 10px rgba(255, 71, 87, 0.5)' }}>{bombs}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button 
          onClick={() => setIsActive(!isActive)}
          className="btn-timer-main"
          style={{
            borderColor: accentColor,
            backgroundColor: isActive ? 'transparent' : accentColor,
            color: isActive ? accentColor : '#020617',
            boxShadow: isActive ? 'none' : `0 0 15px ${accentColor}44`
          }}
        >
          {isActive ? 'PAUSE' : 'START'}
        </button>
        <button 
          onClick={() => { setIsActive(false); setTimeLeft(totalTime); }}
          className="btn-timer-sub"
        >
          RESET
        </button>
      </div>

      <style>{`
        /* ★ CSS側で矢印のバランスもきれいに整えました */
        .btn-back {
          position: absolute;
          top: 30px;
          left: 40px;
          background: transparent;
          color: #d1d5db; /* 画像に近いシルバーグレー */
          border: none;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 26px; /* 文字を大きく */
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 10px;
          letter-spacing: 0.05em; /* 少しだけ文字間隔をあけてバランスを取る */
        }
        .btn-back:hover {
          color: white;
          transform: translateX(-5px);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }

        .btn-timer-main {
          width: 280px;
          padding: 20px;
          font-family: 'Courier New', monospace;
          font-size: 1.5rem;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.2em;
        }
        .btn-timer-main:hover {
          transform: scale(1.02);
        }
        .btn-timer-sub {
          width: 140px;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255,255,255,0.3);
          font-family: 'Courier New', monospace;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.1em;
        }
        .btn-timer-sub:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: white;
        }
      `}</style>
    </div>
  );
}