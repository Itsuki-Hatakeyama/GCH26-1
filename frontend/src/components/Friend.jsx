import React, { useState, useEffect } from 'react';

export default function Friends({ onBack, currentUser }) {
  const [activeTab, setActiveTab] = useState('network'); // 'network' または 'requests'
  const [friendsData, setFriendsData] = useState([]);
  const [requestsData, setRequestsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:5000";
  const accentColor = '#38bdf8';

  // ★ バックエンドが出来るまでのダミーデータ
  const loadDummyData = () => {
    setFriendsData([
      { user_id: 'cyber_ninja', status: 'ONLINE', score: 99999 },
      { user_id: 'neon_rider', status: 'OFFLINE', score: 85000 },
      { user_id: 'ghost_in_shell', status: 'ONLINE', score: 42000 },
    ]);
    
    setRequestsData([
      { user_id: 'hacker_01', date: '2026-03-12' },
      { user_id: 'guest_99', date: '2026-03-10' }
    ]);
  };

  useEffect(() => {
    // 実際のAPIができるまではダミーを読み込む
    const fetchFriends = async () => {
      try {
        // ※ 将来的にここで GET /api/friends/list などを叩きます
        setIsLoading(true);
        setTimeout(() => {
          loadDummyData();
          setIsLoading(false);
        }, 500); // 0.5秒のローディング演出
      } catch (error) {
        console.error("フレンド取得エラー:", error);
        loadDummyData();
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, []);

  // ダミーの承認・削除アクション
  const handleAcceptRequest = (userId) => {
    alert(`[SYSTEM] ${userId} のリクエストを承認しました！(※ダミー機能)`);
    // リクエスト一覧から消して、フレンド一覧に追加する擬似処理
    setRequestsData(requestsData.filter(req => req.user_id !== userId));
    setFriendsData([...friendsData, { user_id: userId, status: 'ONLINE', score: 0 }]);
  };

  const handleRemoveFriend = (userId) => {
    if(window.confirm(`[WARNING] ${userId} とのネットワークを切断しますか？`)) {
      setFriendsData(friendsData.filter(friend => friend.user_id !== userId));
    }
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
      
      {/* 戻るボタン */}
      <button className="btn-back" onClick={onBack}>← HOME</button>

      {/* ヘッダー部分 */}
      <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '20px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          color: 'white', 
          fontFamily: 'Courier New, monospace',
          textShadow: `0 0 20px ${accentColor}`,
          letterSpacing: '0.2em',
          margin: '0 0 10px 0'
        }}>
          FRIEND
        </h1>
        <p style={{ color: accentColor, letterSpacing: '0.4em', fontFamily: 'monospace', margin: 0 }}>
          {">> CONNECTION ESTABLISHED"}
        </p>
      </div>

      {/* タブ切り替え */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          MY FRIEND ({friendsData.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          REQUESTS ({requestsData.length})
        </button>
      </div>

      {/* メインボード */}
      <div className="friends-board">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: accentColor, fontFamily: 'monospace' }}>
            [ SCANNING NETWORK... ]
          </div>
        ) : (
          <div className="friends-list">
            
            {/* --- MY NETWORK タブの内容 --- */}
            {activeTab === 'network' && (
              <>
                {friendsData.length === 0 ? (
                  <div className="empty-message">NO CONNECTIONS FOUND.</div>
                ) : (
                  friendsData.map((friend, index) => (
                    <div key={index} className="friend-row">
                      <div className="friend-info">
                        <div className={`status-dot ${friend.status === 'ONLINE' ? 'online' : 'offline'}`}></div>
                        <div className="friend-name">{friend.user_id}</div>
                      </div>
                      <div className="friend-actions">
                        <span style={{ color: accentColor, marginRight: '20px', fontSize: '0.9rem' }}>
                          SCORE: {friend.score.toLocaleString()}
                        </span>
                        <button className="btn-remove" onClick={() => handleRemoveFriend(friend.user_id)}>
                          [ DISCONNECT ]
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* --- REQUESTS タブの内容 --- */}
            {activeTab === 'requests' && (
              <>
                {requestsData.length === 0 ? (
                  <div className="empty-message">NO PENDING REQUESTS.</div>
                ) : (
                  requestsData.map((req, index) => (
                    <div key={index} className="friend-row">
                      <div className="friend-info">
                        <div className="friend-name" style={{ color: '#ffd700' }}>{req.user_id}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginLeft: '10px' }}>
                          DATE: {req.date}
                        </div>
                      </div>
                      <div className="friend-actions">
                        <button className="btn-accept" onClick={() => handleAcceptRequest(req.user_id)}>
                          [ ACCEPT ]
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

          </div>
        )}
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

        .tab-container {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          width: 800px;
          max-width: 95%;
        }

        .tab-btn {
          flex: 1;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: rgba(255,255,255,0.5);
          padding: 15px;
          font-family: 'Courier New', monospace;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.1em;
        }

        .tab-btn:hover {
          background: rgba(56, 189, 248, 0.1);
          color: white;
        }

        .tab-btn.active {
          background: rgba(56, 189, 248, 0.2);
          border-color: ${accentColor};
          color: ${accentColor};
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
          text-shadow: 0 0 5px ${accentColor};
        }

        .friends-board {
          width: 800px;
          max-width: 95%;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 4px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          min-height: 400px;
        }

        .friends-list {
          display: flex;
          flex-direction: column;
        }

        .friend-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-family: 'Courier New', monospace;
          transition: background-color 0.2s;
        }
        .friend-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .friend-row:last-child {
          border-bottom: none;
        }

        .friend-info {
          display: flex;
          align-items: center;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 15px;
        }
        .status-dot.online {
          background-color: #2ed573;
          box-shadow: 0 0 10px #2ed573;
        }
        .status-dot.offline {
          background-color: #57606f;
        }

        .friend-name {
          font-size: 1.2rem;
          color: white;
          font-weight: bold;
        }

        .friend-actions {
          display: flex;
          align-items: center;
        }

        .btn-remove {
          background: transparent;
          color: #ff4757;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: monospace;
          font-size: 0.9rem;
          transition: 0.2s;
        }
        .btn-remove:hover {
          text-shadow: 0 0 8px #ff4757;
          border-bottom: 1px solid #ff4757;
        }

        .btn-accept {
          background: transparent;
          color: #2ed573;
          border: 1px solid #2ed573;
          padding: 8px 15px;
          cursor: pointer;
          font-family: monospace;
          font-weight: bold;
          transition: 0.2s;
          border-radius: 4px;
        }
        .btn-accept:hover {
          background: rgba(46, 213, 115, 0.2);
          box-shadow: 0 0 10px rgba(46, 213, 115, 0.5);
        }

        .empty-message {
          text-align: center;
          padding: 50px;
          color: rgba(255,255,255,0.4);
          font-family: monospace;
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
}