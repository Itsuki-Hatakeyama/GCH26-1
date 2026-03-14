import React, { useState, useEffect } from 'react';

export default function Missions({ onBack, currentUser }) {
  const accentColor = '#38bdf8';
  
  // APIから取得したデータを保存する状態
  const [missionData, setMissionData] = useState({
    study_time: 0,
    target_time: 0,
    is_cleared: false,
    is_claimed: false
  });
  const [loading, setLoading] = useState(true);

  // 画面が開かれたときにAPIからデータを取得する
  useEffect(() => {
    fetchMissionData();
  }, []);

  // [12] デイリー進捗確認 (GET)
  const fetchMissionData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/missions/daily?user_id=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setMissionData(data);
      } else {
        console.error("ミッションデータの取得に失敗しました");
      }
    } catch (error) {
      console.error("通信エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // [13] デイリー報酬受け取り (POST)
  const handleClaimReward = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/missions/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: currentUser.id }),
      });

      if (response.ok) {
        alert(">> MISSION COMPLETE: ボムを1個獲得しました！");
        fetchMissionData(); // 受け取った後の最新データに更新する
      } else {
        const errorData = await response.json();
        alert(`エラー: ${errorData.error || '報酬の受け取りに失敗しました'}`);
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("通信エラーが発生しました。");
    }
  };

  return (
    <div className="container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'monospace',
      position: 'relative'
    }}>
      
      {/* 戻るボタン */}
      <button 
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'transparent',
          color: accentColor,
          border: `1px solid ${accentColor}`,
          padding: '8px 16px',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}
      >
        [ BACK ]
      </button>

      <h2 style={{ color: accentColor, fontSize: '2.5rem', marginBottom: '40px', letterSpacing: '0.2em' }}>
        DAILY MISSIONS
      </h2>

      {loading ? (
        <p style={{ color: accentColor }}>[ LOADING DATA... ]</p>
      ) : (
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: `1px solid ${accentColor}`,
          padding: '40px',
          borderRadius: '8px',
          width: '80%',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: `0 0 20px rgba(56, 189, 248, 0.2)`
        }}>
          
          <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>本日の勉強時間</h3>
          
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: accentColor, marginBottom: '10px' }}>
            {missionData.study_time} / {missionData.target_time} <span style={{ fontSize: '1.5rem' }}>MIN</span>
          </div>

          <div style={{ margin: '30px 0' }}>
            {missionData.is_claimed ? (
              <p style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>
                [ 報酬獲得済み / REWARD CLAIMED ]
              </p>
            ) : missionData.is_cleared ? (
              <button 
                onClick={handleClaimReward}
                style={{
                  background: accentColor,
                  color: '#0f172a',
                  border: 'none',
                  padding: '15px 30px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  boxShadow: `0 0 15px ${accentColor}`,
                  fontFamily: 'monospace'
                }}
              >
                [ GET REWARD (BOMB +1) ]
              </button>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                ミッション未達成 (INCOMPLETE)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}