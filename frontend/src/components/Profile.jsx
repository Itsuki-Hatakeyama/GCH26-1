import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Profile({ onBack, currentUser }) {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:5000";
  const accentColor = '#38bdf8';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/profile?user_id=${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          // ★ 確定したAPIのJSONキーに完全に合わせました！
          setProfileData({
            total_time: data.study_minutes || 0,
            high_score: data.high_score || 0,
            bombs: data.bomb_count || 0,
            study_stats: data.study_stats || [] 
          });
        } else {
          throw new Error("Network response was not ok");
        }
      } catch (error) {
        console.log("APIエラー。オフライン用のダミーデータを表示します。");
        setProfileData({
          total_time: 75,
          high_score: 15000,
          bombs: 3,
          study_stats: [
            { subject: '英語', minutes: 50 },
            { subject: '数学', minutes: 25 },
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser.id]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(15,23,42,0.9)', border: `1px solid ${accentColor}`, padding: '10px', color: 'white', fontFamily: 'monospace' }}>
          <p style={{ margin: 0, color: accentColor, fontWeight: 'bold' }}>{label}</p>
          {/* ★ ツールチップの表示も合わせた */}
          <p style={{ margin: 0 }}>{payload[0].value} MINS</p> 
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container theme-home" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '50px 20px', position: 'relative'
    }}>
      <button className="btn-back" onClick={onBack}>← HOME</button>

      <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '3.5rem', color: 'white', fontFamily: 'Courier New, monospace', textShadow: `0 0 20px ${accentColor}`, letterSpacing: '0.2em', margin: '0 0 10px 0' }}>
          USER_PROFILE
        </h1>
        <p style={{ color: accentColor, letterSpacing: '0.4em', fontFamily: 'monospace', margin: 0 }}>
          {">> ID: "}{currentUser?.id}
        </p>
      </div>

      {isLoading || !profileData ? (
        <div style={{ color: accentColor, fontFamily: 'monospace', marginTop: '50px', fontSize: '1.5rem' }}>[ LOADING DATA... ]</div>
      ) : (
        <div className="profile-board">
          
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">TOTAL STUDY TIME</div>
              <div className="stat-value" style={{ color: '#2ed573' }}>
                {profileData.total_time} <span style={{ fontSize: '1rem' }}>MIN</span>
              </div>
            </div>
            <div className="stat-box highlight-box">
              <div className="stat-label" style={{ color: '#ffd700' }}>PUZZLE HIGH SCORE</div>
              <div className="stat-value" style={{ color: '#ffd700', textShadow: '0 0 15px rgba(255, 215, 0, 0.5)' }}>
                {profileData.high_score.toLocaleString()}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">BOMB STOCK</div>
              <div className="stat-value" style={{ color: '#ff4757' }}>
                {profileData.bombs} <span style={{ fontSize: '1rem' }}>UNITS</span>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h3 style={{
              fontSize: '14px', // 必要に応じて少し小さく（12pxなど）
              color: 'white',
              whiteSpace: 'nowrap', /* ← これを追加！絶対に改行させない */
              overflow: 'hidden',   /* 念のためはみ出した分を隠す（もしくは textOverflow: 'ellipsis'） */
              letterSpacing: '0.1em'
            }}>
              [ SUBJECT ANALYSIS ]
            </h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profileData.study_stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  {/* ★ グラフのキーを subject と minutes に修正！ */}
                  <XAxis dataKey="subject" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'white', fontFamily: 'monospace' }} />
                  <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'white', fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                    {profileData.study_stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={accentColor} style={{ filter: `drop-shadow(0px 0px 5px ${accentColor})` }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      <style>{`
        .btn-back { position: absolute; top: 30px; left: 40px; background: transparent; color: #d1d5db; border: none; font-size: 26px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; padding: 10px; letter-spacing: 0.05em; }
        .btn-back:hover { color: white; transform: translateX(-5px); text-shadow: 0 0 10px rgba(255, 255, 255, 0.4); }
        .profile-board { width: 900px; max-width: 95%; display: flex; flexDirection: column; gap: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .stat-box { background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; padding: 25px; text-align: center; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); }
        .highlight-box { border-color: rgba(255, 215, 0, 0.5); background: rgba(255, 215, 0, 0.05); transform: scale(1.05); z-index: 10; }
        .stat-label { font-family: 'Courier New', monospace; font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-bottom: 10px; letter-spacing: 0.1em; }
        .stat-value { font-family: 'Courier New', monospace; font-size: 2.5rem; font-weight: bold; }
        .chart-container { background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; padding: 30px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); }
      `}</style>
    </div>
  );
}