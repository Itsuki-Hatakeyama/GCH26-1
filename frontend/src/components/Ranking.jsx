import React, { useState, useEffect } from 'react';

export default function Ranking({ onBack, currentUser }) {
  const [rankingData, setRankingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // モーダル用の状態管理
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalProfileData, setModalProfileData] = useState({ study_minutes: 0, bomb_count: 0 });
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  // フレンド申請の状態管理（未送信 / 送信中 / 送信済）
  const [requestStatus, setRequestStatus] = useState('idle'); 

  const API_BASE = "http://127.0.0.1:5000";
  const accentColor = '#38bdf8';

  const loadDummyData = () => {
    setRankingData([
      { rank: 1, user_id: 'cyber_ninja', score: 99999 },
      { rank: 2, user_id: 'neon_rider', score: 85000 },
      { rank: 3, user_id: currentUser?.id || 'test_user', score: 72000 },
      { rank: 4, user_id: 'hacker_01', score: 65000 },
      { rank: 5, user_id: 'guest_99', score: 50000 },
    ]);
  };

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/game/ranking`);
        if (response.ok) {
          const data = await response.json();
          const fetchedData = data.ranking || data;
          if (fetchedData && fetchedData.length > 0) {
            setRankingData(fetchedData);
          } else {
            loadDummyData();
          }
        } else {
          loadDummyData();
        }
      } catch (error) {
        console.error("ランキング取得エラー:", error);
        loadDummyData(); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchRanking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserClick = async (userId) => {
    setSelectedUser(userId);
    setIsModalLoading(true);
    setRequestStatus('idle'); // モーダルを開くたびに申請状態をリセット

    try {
      const response = await fetch(`${API_BASE}/api/user/profile?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setModalProfileData({
          study_minutes: data.study_minutes || 0,
          bomb_count: data.bomb_count || 0
        });
      } else {
        loadModalDummyData(userId);
      }
    } catch (error) {
      loadModalDummyData(userId);
    } finally {
      setIsModalLoading(false);
    }
  };

  const loadModalDummyData = (userId) => {
    const randomTime = Math.floor(Math.random() * 500) + 50; 
    const randomBomb = Math.floor(Math.random() * 10) + 1;
    setModalProfileData({ study_minutes: randomTime, bomb_count: randomBomb });
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  // フレンド申請ボタンを押した時のダミー処理
  const handleSendRequest = () => {
    setRequestStatus('sending'); // 「通信中」にする
    // 1秒後に「送信完了」にする
    setTimeout(() => {
      setRequestStatus('sent');
    }, 1000);
  };

  return (
    <div className="container theme-home" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '50px 20px',
      position: 'relative'
    }}>
      
      <button className="btn-back" onClick={onBack}>← HOME</button>

      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          color: 'white', 
          fontFamily: 'Courier New, monospace',
          textShadow: `0 0 20px ${accentColor}`,
          letterSpacing: '0.2em',
          margin: '0 0 10px 0'
        }}>
          GLOBAL RANKING
        </h1>
        <p style={{ color: accentColor, letterSpacing: '0.4em', fontFamily: 'monospace', margin: 0 }}>
          {">> TOP HACKERS SCORE BOARD"}
        </p>
      </div>

      <div className="ranking-board">
        <div className="ranking-header">
          <div className="col-rank">RANK</div>
          <div className="col-name">USER_ID</div>
          <div className="col-score">SCORE</div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: accentColor, fontFamily: 'monospace' }}>
            [ LOADING DATA... ]
          </div>
        ) : (
          <div className="ranking-list">
            {rankingData.map((player, index) => {
              const isMe = player.user_id === currentUser?.id;
              let rankColor = 'white';
              let rankShadow = 'none';
              if (player.rank === 1) { rankColor = '#ffd700'; rankShadow = '0 0 10px rgba(255,215,0,0.5)'; }
              else if (player.rank === 2) { rankColor = '#c0c0c0'; rankShadow = '0 0 10px rgba(192,192,192,0.5)'; }
              else if (player.rank === 3) { rankColor = '#cd7f32'; rankShadow = '0 0 10px rgba(205,127,50,0.5)'; }

              return (
                <div key={index} className={`ranking-row ${isMe ? 'is-me' : ''}`}>
                  <div className="col-rank" style={{ color: rankColor, textShadow: rankShadow, fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {player.rank < 10 ? `0${player.rank}` : player.rank}
                  </div>
                  <div 
                    className="col-name name-clickable" 
                    onClick={() => handleUserClick(player.user_id)}
                    style={{ color: isMe ? '#020617' : 'white' }}
                  >
                    {player.user_id} {isMe && <span style={{ fontSize: '0.8rem', marginLeft: '10px' }}>[YOU]</span>}
                  </div>
                  <div className="col-score" style={{ color: isMe ? '#020617' : accentColor, fontWeight: 'bold' }}>
                    {player.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* モーダル（小窓） */}
      {selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-modal-close" onClick={closeModal}>[ X ]</button>
            
            <h2 style={{ color: accentColor, margin: '0 0 20px 0', borderBottom: `1px solid ${accentColor}55`, paddingBottom: '10px' }}>
              _USER_DATA
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>ID:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedUser}</div>
            </div>

            {isModalLoading ? (
              <div style={{ color: accentColor, textAlign: 'center', padding: '20px 0' }}>[ SEARCHING... ]</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="modal-stat-box">
                  <span className="stat-label">TOTAL_FOCUS</span>
                  <span className="stat-value" style={{ color: '#2ed573' }}>{modalProfileData.study_minutes} <span style={{fontSize:'0.8rem'}}>MIN</span></span>
                </div>
                <div className="modal-stat-box">
                  <span className="stat-label">BOMB_STOCK</span>
                  <span className="stat-value" style={{ color: '#ff4757' }}>{modalProfileData.bomb_count} <span style={{fontSize:'0.8rem'}}>UNITS</span></span>
                </div>

                {/* ★ 変更：ボタンのテキストを「ADD FRIEND」に変更しました */}
                {selectedUser !== currentUser?.id && (
                  <div style={{ marginTop: '10px' }}>
                    <button 
                      className={`btn-friend-request ${requestStatus === 'sent' ? 'sent' : ''}`}
                      onClick={handleSendRequest}
                      disabled={requestStatus === 'sending' || requestStatus === 'sent'}
                    >
                      {requestStatus === 'idle' && '[ + ADD FRIEND ]'}
                      {requestStatus === 'sending' && '[ SENDING REQUEST... ]'}
                      {requestStatus === 'sent' && '[ REQUEST SENT ✓ ]'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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

        .ranking-board {
          width: 800px;
          max-width: 95%;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 4px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .ranking-header {
          display: flex;
          padding: 15px 30px;
          background: rgba(56, 189, 248, 0.1);
          border-bottom: 1px solid rgba(56, 189, 248, 0.3);
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          font-weight: bold;
          letter-spacing: 0.1em;
        }

        .ranking-list {
          display: flex;
          flex-direction: column;
        }

        .ranking-row {
          display: flex;
          padding: 20px 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-family: 'Courier New', monospace;
          align-items: center;
          transition: background-color 0.2s;
        }
        .ranking-row:last-child {
          border-bottom: none;
        }
        .ranking-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .ranking-row.is-me {
          background: ${accentColor};
          box-shadow: 0 0 15px ${accentColor};
          border-color: ${accentColor};
          transform: scale(1.01);
          z-index: 10;
          position: relative;
        }

        .col-rank { width: 15%; text-align: center; }
        .col-name { width: 55%; text-align: left; padding-left: 20px; }
        .col-score { width: 30%; text-align: right; font-size: 1.2rem; }

        .name-clickable {
          cursor: pointer;
          transition: color 0.2s, text-shadow 0.2s;
        }
        .ranking-row:not(.is-me) .name-clickable:hover {
          color: ${accentColor} !important;
          text-shadow: 0 0 8px ${accentColor};
          text-decoration: underline;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(2, 6, 23, 0.8);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid ${accentColor};
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.4);
          padding: 30px;
          width: 350px;
          border-radius: 4px;
          position: relative;
          color: white;
          font-family: 'Courier New', monospace;
          animation: slideIn 0.3s ease-out forwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .btn-modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: transparent;
          color: rgba(255,255,255,0.5);
          border: none;
          cursor: pointer;
          font-family: monospace;
          font-size: 16px;
          transition: 0.2s;
        }
        .btn-modal-close:hover {
          color: #ff4757;
        }

        .modal-stat-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.05);
          padding: 10px 15px;
          border-radius: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
        }
        .stat-value {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .btn-friend-request {
          width: 100%;
          background: transparent;
          color: #2ed573;
          border: 1px solid #2ed573;
          padding: 12px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.05em;
          border-radius: 4px;
        }
        .btn-friend-request:hover:not(:disabled) {
          background: rgba(46, 213, 115, 0.1);
          box-shadow: 0 0 15px rgba(46, 213, 115, 0.4);
        }
        .btn-friend-request:disabled {
          cursor: default;
        }
        .btn-friend-request.sent {
          color: #a4b0be;
          border-color: #a4b0be;
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}