import React from 'react';

export default function Guide({ onBack }) {
  const accentColor = '#38bdf8';

  const stepCardStyle = {
    background: 'rgba(30, 41, 59, 0.8)',
    border: `1px solid ${accentColor}`,
    borderRadius: '8px',
    padding: '25px',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '600px',
    textAlign: 'left',
    boxShadow: `0 0 15px rgba(56, 189, 248, 0.1)`,
    position: 'relative'
  };

  const stepNumberStyle = {
    position: 'absolute',
    top: '-15px',
    left: '-15px',
    background: accentColor,
    color: '#0f172a',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    boxShadow: `0 0 10px ${accentColor}`
  };

  const highlightStyle = {
    color: accentColor,
    fontWeight: 'bold'
  };

  return (
    <div className="container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'monospace',
      position: 'relative',
      overflowY: 'auto'
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

      <h2 style={{ 
        color: accentColor, 
        fontSize: '2.5rem', 
        marginBottom: '10px', 
        letterSpacing: '0.2em',
        marginTop: '40px'
      }}>
        SYSTEM GUIDE
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '40px', letterSpacing: '0.1em' }}>
        DRYOKU & PUZZLE プレイループ解説
      </p>

      {/* STEP 1 */}
      <div style={stepCardStyle}>
        <div style={stepNumberStyle}>01</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>
          FOCUS & STUDY <span style={{ fontSize: '1rem', color: '#94a3b8' }}>// 集中して勉強する</span>
        </h3>
        <p style={{ lineHeight: '1.6', color: '#e2e8f0' }}>
          まずは「START MISSION」からタイマーを起動し、今日の目標時間に向かって集中しましょう。
          あなたの<span style={highlightStyle}>現実での努力（DRYOKU）</span>が、ゲームを有利に進めるための最強の武器になります。
        </p>
      </div>

      {/* STEP 2 */}
      <div style={stepCardStyle}>
        <div style={stepNumberStyle}>02</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>
          GET REWARD <span style={{ fontSize: '1rem', color: '#94a3b8' }}>// 報酬を獲得する</span>
        </h3>
        <p style={{ lineHeight: '1.6', color: '#e2e8f0' }}>
          目標時間をクリアしたら「MISSIONS」画面へアクセス！
          デイリーミッション達成の報酬として、強力なアイテム<span style={highlightStyle}>「ボム（BOMB）」</span>を1つ獲得できます。
          ※報酬の受け取りは1日1回限定です。
        </p>
      </div>

      {/* STEP 3 */}
      <div style={stepCardStyle}>
        <div style={stepNumberStyle}>03</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>
          PLAY PUZZLE <span style={{ fontSize: '1rem', color: '#94a3b8' }}>// ハイスコアを狙う</span>
        </h3>
        <p style={{ lineHeight: '1.6', color: '#e2e8f0' }}>
          獲得したボムを使ってパズルに挑戦！<br />
          ボムを起動すると<span style={highlightStyle}>タップした周囲3x3のブロックを強制消去</span>します。<br /><br />
          ピンチを切り抜けるだけでなく、うまく連鎖（コンボ）を繋げば<span style={highlightStyle}>スコア最大5倍</span>のボーナスが発生！努力の結晶を爆発させて、ランキング上位を目指しましょう。
        </p>
      </div>

    </div>
  );
}