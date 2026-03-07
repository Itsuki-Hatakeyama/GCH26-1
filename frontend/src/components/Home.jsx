import React from 'react';

// onNavigate という「画面を切り替える関数」を受け取ります
export default function Home({ onNavigate }) {
  return (
    <div className="container theme-home">
      <div className="home-content">
        <h1 className="app-title">PUZZLE & DRYOKU's</h1>
        <p className="app-subtitle">集中してランクを上げよう</p>
        <div className="menu-group">
          <button className="btn-main" onClick={() => onNavigate('timer')}>
            START MISSION
          </button>
          <button className="btn-sub" onClick={() => onNavigate('ranking')}>
            RANKING
          </button>
          <button className="btn-sub" style={{marginTop: '10px', borderColor: '#8b5cf6', color: '#c4b5fd'}} onClick={() => onNavigate('game')}>
            🎮 PLAY PUZZLE
          </button>
        </div>
      </div>
    </div>
  );
}