import React, { useState, useEffect } from 'react';

export default function Profile({ onBack, currentUser }) {
  const [profileData, setProfileData] = useState({
    study_minutes: 0,
    bomb_count: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:5000";
  const accentColor = '#38bdf8'; // 空色

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // ★ ご友人に /api/user/profile (GET) のようなAPIを作ってもらう想定です！
        const response = await fetch(`${API_BASE}/api/user/profile?user_id=${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData({
            study_minutes: data.study_minutes || 0,
            bomb_count: data.bomb_count || 0
          });
        } else {
          loadDummyData(); // APIがない・未完成の場合はダミーを表示
        }
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        loadDummyData(); // 通信エラー時もダミーを表示
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser.id]);

  // API未実装時のダミーデータ
  const loadDummyData = () => {
    setProfileData({
      study_minutes: 125, // 例: 125分
      bomb_count: 5       // 例: ボム5個
    });
  };

  return (
    <div className="container theme-home" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      position: 'relative'
    }}>
      
      {/* 戻るボタン */}
      <button className="btn-back" onClick={onBack}>← HOME</button>

      <h1 style={{ 
        fontSize: '4rem', 
        color: 'white', 
        fontFamily: 'Courier New, monospace',
        textShadow: `0 0 20px ${accentColor}`,
        letterSpacing: '0.2em',
        marginBottom: '40px'
      }}>
        AGENT PROFILE
      </h1>

      {/* ステータスカード */}
      <div style={{
        width: '500px',
        maxWidth: '90%',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        border: `1px solid ${accentColor}55`,
        borderRadius: '4px',
        boxShadow: `0 0 30px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(10px)',
        padding: '50px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        
        {/* USER ID */}
        <div>
          <div style={{ color: accentColor, fontSize: '14px', fontFamily: 'monospace', marginBottom: '8px', letterSpacing: '0.1em' }}>
            _USER_ID:
          </div>
          <div style={{ fontSize: '2.5rem', color: 'white', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}>
            {currentUser.id}
          </div>
        </div>

        {/* STUDY MINUTES (累計勉強時間) */}
        <div>
          <div style={{ color: accentColor, fontSize: '14px', fontFamily: 'monospace', marginBottom: '8px', letterSpacing: '0.1em' }}>
            _TOTAL_FOCUS_TIME:
          </div>
          <div style={{ fontSize: '3rem', color: '#2ed573', fontWeight: 'bold', fontFamily: 'Courier New, monospace', textShadow: '0 0 15px rgba(46, 213, 115, 0.4)' }}>
            {isLoading ? "---" : profileData.study_minutes} 
            <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', textShadow: 'none', marginLeft: '10px' }}>MINUTES</span>
          </div>
        </div>

        {/* BOMB COUNT (所持ボム数) */}
        <div>
          <div style={{ color: accentColor, fontSize: '14px', fontFamily: 'monospace', marginBottom: '8px', letterSpacing: '0.1em' }}>
            _BOMB_STOCK:
          </div>
          <div style={{ fontSize: '3rem', color: '#ff4757', fontWeight: 'bold', fontFamily: 'Courier New, monospace', textShadow: '0 0 15px rgba(255, 71, 87, 0.4)' }}>
            {isLoading ? "---" : profileData.bomb_count} 
            <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', textShadow: 'none', marginLeft: '10px' }}>UNITS</span>
          </div>
        </div>

      </div>

      {/* --- CSS設定 --- */}
      <style>{`
        .btn-back {
          position: absolute;
          top: 30px;
          left: 40px;
          background: transparent;
          color: #d1d5db;
          border: none;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 26px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 10px;
          letter-spacing: 0.05em;
        }
        .btn-back:hover {
          color: white;
          transform: translateX(-5px);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}