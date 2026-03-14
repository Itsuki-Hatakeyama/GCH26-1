import React from 'react';

export default function Home({ onNavigate, currentUser, onLogout }) {
  const accentColor = '#38bdf8';

  return (
    <div className="container theme-home" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      position: 'relative',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      
      {/* --- 左上のメニュー --- */}
      <div className="left-menu-container">
        <button className="btn-side" onClick={() => onNavigate('profile')}>
          <span style={{ fontSize: '0.8em', marginRight: '5px' }}>ID:</span>
          {currentUser?.id || "GUEST"}
        </button>
        <button className="btn-side" onClick={() => onNavigate('friends')}>
          [ FRIEND ]
        </button>
      </div>
      
      {/* --- 右上のシステム操作エリア --- */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px'
      }}>
        <div style={{ color: accentColor, fontSize: '12px', fontFamily: 'monospace', opacity: 0.7 }}>
          STATUS: ONLINE // USER: {currentUser?.id}
        </div>
        
        {/* ★ 修正：HOW TO PLAY のクラスを btn-side に変更し、縦のズレを防ぐため alignItems: 'center' を追加しました */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => onNavigate('guide')} className="btn-side">
            [ HOW TO PLAY ]
          </button>
          
          <button onClick={onLogout} className="btn-logout">
            [ LOGOUT ]
          </button>
        </div>
      </div>

      {/* --- メインコンテンツ --- */}
      <div className="home-content">
        <h1 className="app-title" style={{ 
          fontSize: '6rem', 
          lineHeight: '1.1',
          marginBottom: '10px' 
        }}>
          PUZZLE<br />& <br />DRYOKU's
        </h1>
        
        <p style={{ 
          color: accentColor, 
          marginTop: '20px', 
          marginBottom: '60px', 
          fontSize: '1.2rem',
          letterSpacing: '0.5em',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textShadow: `0 0 10px ${accentColor}aa`
        }}>
          {">> 集中モードを起動してください"}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center' }}>
          <button className="btn-cyber-main" onClick={() => onNavigate('timer')}>
            [ 01. START MISSION ]
          </button>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <button className="btn-cyber-sub" onClick={() => onNavigate('game')}>
              [ 02. PLAY PUZZLE ]
            </button>
            <button className="btn-cyber-sub" onClick={() => onNavigate('ranking')}>
              [ 03. RANKING ]
            </button>
            <button className="btn-cyber-sub" onClick={() => onNavigate('missions')}>
              [ 04. MISSIONS ]
            </button>
          </div>
        </div>
      </div>

      {/* --- CSS設定 --- */}
      <style>{`
        .left-menu-container {
          position: absolute;
          top: 30px;
          left: 40px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .btn-side {
          background: rgba(15, 23, 42, 0.5);
          color: ${accentColor};
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 10px 20px;
          letter-spacing: 0.1em;
          backdrop-filter: blur(5px);
          min-width: 140px;
          text-align: center;
        }
        .btn-side:hover {
          background: rgba(56, 189, 248, 0.1);
          color: white;
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.5);
          border-color: ${accentColor};
          transform: translateX(5px);
        }

        .btn-logout {
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 5px 10px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-logout:hover {
          color: #ff4757;
          border-color: #ff4757;
          background: rgba(255, 71, 87, 0.1);
        }

        .btn-cyber-main {
          width: 480px;
          padding: 25px;
          background: transparent;
          color: ${accentColor};
          border: 2px solid ${accentColor};
          font-family: 'Courier New', monospace;
          font-size: 24px;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.15em;
          box-shadow: 0 0 20px ${accentColor}44;
          white-space: nowrap;
        }
        .btn-cyber-main:hover {
          background: ${accentColor};
          color: #020617;
          box-shadow: 0 0 40px ${accentColor};
          transform: scale(1.02);
        }

        .btn-cyber-sub {
          width: 230px;
          padding: 18px;
          background: rgba(30, 41, 59, 0.5);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
          letter-spacing: 0.05em;
        }
        .btn-cyber-sub:hover {
          border-color: ${accentColor};
          color: ${accentColor};
          background: rgba(56, 189, 248, 0.1);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}