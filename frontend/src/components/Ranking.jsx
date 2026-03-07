import React from 'react';

// onBack という「HOMEに戻る関数」を受け取ります
export default function Ranking({ onBack }) {
  return (
    <div className="container theme-ranking">
      <button className="btn-back" onClick={onBack}>← HOME</button>
      
      <div className="ranking-content">
        <h1 className="ranking-title">🏆 RANKING</h1>
        <p className="ranking-subtitle">世界のフォーカスマスター達</p>

        <div className="ranking-board">
          <div className="ranking-item rank-1"><span className="rank-num">1</span><span className="rank-name">Player_Zero</span><span className="rank-score">999 hrs</span></div>
          <div className="ranking-item rank-2"><span className="rank-num">2</span><span className="rank-name">Focus_Ninja</span><span className="rank-score">850 hrs</span></div>
          <div className="ranking-item rank-3"><span className="rank-num">3</span><span className="rank-name">Time_Hacker</span><span className="rank-score">720 hrs</span></div>
          <div className="ranking-item my-rank"><span className="rank-num">99+</span><span className="rank-name">YOU</span><span className="rank-score">0 hrs</span></div>
        </div>
      </div>
    </div>
  );
}