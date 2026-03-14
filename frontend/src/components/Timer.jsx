import React, { useState, useEffect } from 'react';

export default function Timer({ onBack, currentUser }) {
  // ★ テスト用時間
  const FOCUS_TIME = 5; 
  const BREAK_TIME = 5;

  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  
  const [bombs, setBombs] = useState(0); 
  const [completedCount, setCompletedCount] = useState(0); 
  const [subject, setSubject] = useState(""); 

  const API_BASE = "http://127.0.0.1:5000";
  const accentColor = isBreak ? '#2ed573' : '#38bdf8';
  const totalTime = isBreak ? BREAK_TIME : FOCUS_TIME;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/profile?user_id=${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.bomb_count !== undefined) {
            setBombs(data.bomb_count);
          }
        }
      } catch (error) {
        console.error("ボム数取得エラー:", error);
      }
    };
    fetchInitialData();
  }, [currentUser.id]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // ★ 復活：00:00になった状態を「1秒間」見せてから切り替える！
      interval = setTimeout(() => {
        handleTimerComplete();
      }, 1000); 
    } else {
      clearInterval(interval);
      clearTimeout(interval); // setTimeoutのクリアも追加
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
      // 画面の切り替えは待たずに即座に行う
      setIsBreak(true);
      setTimeLeft(BREAK_TIME);
      
      const targetSubject = subject.trim() === "" ? "NO_TARGET" : subject;

      // APIへのデータ送信は裏側で行う
      try {
        const response = await fetch(`${API_BASE}/api/pomodoro/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: currentUser.id, 
            study_minutes: 25,
            subject_name: targetSubject 
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.bomb_count !== undefined) {
             setBombs(data.bomb_count); 
          } else {
             setBombs(prev => prev + 1);
          }
          setCompletedCount(prev => prev + 1); 
          console.log(`ミッション完了！DBに保存しました。[TARGET: ${targetSubject}]`);
        } else {
          throw new Error("APIエラー");
        }
      } catch (error) {
        setBombs(prev => prev + 1);
        setCompletedCount(prev => prev + 1);
        console.error("裏側でのDB保存に失敗しました:", error);
      }
    } else {
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
    <div className="container theme-home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', position: 'relative' }}>
      <button className="btn-back" onClick={onBack}>← HOME</button>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: accentColor, letterSpacing: '0.3em', fontSize: '1.2rem', fontFamily: 'monospace', transition: 'color 0.5s' }}>
          {isBreak ? '-- CURRENT MISSION: RELAX --' : '-- CURRENT MISSION: FOCUS --'}
        </h2>
      </div>

      <div style={{ fontSize: '12rem', fontFamily: 'Courier New, monospace', fontWeight: '900', color: 'white', textShadow: `0 0 30px ${accentColor}`, lineHeight: '1', marginBottom: '20px', transition: 'text-shadow 0.5s' }}>
        {formatTime()}
      </div>

      <div style={{ width: '600px', maxWidth: '90%', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: '30px', borderRadius: '2px', overflow: 'hidden', boxShadow: `0 0 10px ${accentColor}33` }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: accentColor, boxShadow: `0 0 15px ${accentColor}`, transition: 'width 1s linear, background-color 0.5s' }}></div>
      </div>

      {!isBreak && (
        <div style={{ marginBottom: '30px', width: '600px', maxWidth: '90%' }}>
          <input type="text" className="input-subject" placeholder="[ ENTER TARGET SUBJECT ] 例：基本情報、英語..." value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isActive} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', backgroundColor: `${accentColor}11`, padding: '20px 40px', border: `1px solid ${accentColor}33`, borderRadius: '4px', transition: 'all 0.5s' }}>
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
        <button onClick={() => setIsActive(!isActive)} className="btn-timer-main" style={{ borderColor: accentColor, backgroundColor: isActive ? 'transparent' : accentColor, color: isActive ? accentColor : '#020617', boxShadow: isActive ? 'none' : `0 0 15px ${accentColor}44` }}>
          {isActive ? 'PAUSE' : 'START'}
        </button>
        <button onClick={() => { setIsActive(false); setTimeLeft(totalTime); }} className="btn-timer-sub">RESET</button>
      </div>

      <style>{`
        .btn-back { position: absolute; top: 30px; left: 40px; background: transparent; color: #d1d5db; border: none; font-size: 26px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; padding: 10px; letter-spacing: 0.05em; }
        .btn-back:hover { color: white; transform: translateX(-5px); text-shadow: 0 0 10px rgba(255, 255, 255, 0.4); }
        .input-subject { width: 100%; padding: 15px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; color: white; font-family: 'Courier New', monospace; font-size: 1.2rem; text-align: center; letter-spacing: 0.1em; outline: none; transition: all 0.3s; }
        .input-subject:focus { border-color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.4); }
        .input-subject:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-timer-main { width: 280px; padding: 20px; font-family: 'Courier New', monospace; font-size: 1.5rem; font-weight: 900; cursor: pointer; transition: all 0.3s; letter-spacing: 0.2em; }
        .btn-timer-main:hover { transform: scale(1.02); }
        .btn-timer-sub { width: 140px; background: transparent; color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255,255,255,0.3); font-family: 'Courier New', monospace; font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.3s; letter-spacing: 0.1em; }
        .btn-timer-sub:hover { background: rgba(255,255,255,0.1); color: white; border-color: white; }
      `}</style>
    </div>
  );
}