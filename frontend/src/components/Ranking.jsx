import React, { useState, useEffect } from 'react';

export default function Ranking({ onBack, currentUser }) {
  const [rankingData, setRankingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:5000";
  const accentColor = '#38bdf8';

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // ★ いただいたエンドポイント仕様に修正
        const response = await fetch(`${API_BASE}/api/game/ranking`);
        if (response.ok) {
          const data = await response.json();
          // APIからのレスポンス形式に合わせてセット（配列が直接返ってくるか、キーに入っているか）
          setRankingData(data.ranking || data);
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
  }, []);

  // API未実装/エラー確認用のダミーデータ（DBの「score」に変数名を合わせました）
  const loadDummyData = () => {
    setRankingData([
      { rank: 1, user_id: 'cyber_ninja', score: 99999 },
      { rank: 2, user_id: 'neon_rider', score: 85000 },
      { rank: 3, user_id: currentUser?.id || 'test_user', score: 72000 },
      { rank: 4, user_id: 'hacker_01', score: 65000 },
      { rank: 5, user_id: 'guest_99', score: 50000 },
    ]);
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

      {/* ランキングボード */}
      <div className="ranking-board">
        {/* テーブルヘッダー */}
        <div className="ranking-header">
          <div className="col-rank">RANK</div>
          <div className="col-name">USER_ID</div>
          <div className="col-score">SCORE</div>
        </div>

        {/* ローディング表示 */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: accentColor, fontFamily: 'monospace' }}>
            [ LOADING DATA... ]
          </div>
        ) : (
          /* ランキングリスト */
          <div className="ranking-list">
            {rankingData.map((player, index) => {
              // 自分の順位かどうかを判定
              const isMe = player.user_id === currentUser?.id;
              // 上位3位までの色分け
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
                  <div className="col-name" style={{ color: isMe ? '#020617' : 'white' }}>
                    {player.user_id} {isMe && <span style={{ fontSize: '0.8rem', marginLeft: '10px' }}>[YOU]</span>}
                  </div>
                  <div className="col-score" style={{ color: isMe ? '#020617' : accentColor, fontWeight: 'bold' }}>
                    {/* ★ DBの「score」プロパティを参照するように修正 */}
                    {player.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
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
      `}</style>
    </div>
  );
}