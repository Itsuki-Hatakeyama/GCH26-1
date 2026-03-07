import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

function App() {
  // --- フロント側：状態管理（スコアポップアップ用など） ---
  const [popups, setPopups] = useState([]);

  // --- フロント側：入力系エフェクトの状態管理 ---
  const [ripples, setRipples] = useState([]);

  // --- 演出関数 1: 画面シェイク（強弱2パターン） ---
  const triggerShake = (type) => {
    const el = document.getElementById('root');
    // typeによって揺れる強さを変える（ロジック担当が選べるように）
    const animation = type === 'strong' ? 'shake-strong 0.5s' : 'shake-mild 0.3s';
    el.style.animation = animation;
    setTimeout(() => el.style.animation = '', 500);
  };

  // --- 演出関数 2: 花火（単発と連発） ---
  const triggerConfetti = (mode) => {
    if (mode === 'single') {
      // 単発：ブロック消去時など
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      // 連発：ポモドーロ達成時
      const end = Date.now() + 2 * 1000;
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  };

  // --- 演出関数 3: スコアポップアップ ---
  const addPopup = (text) => {
    const id = Date.now();
    setPopups([...popups, { id, text }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1000);
  };

  // --- 演出関数 4: 画面点滅（タイムアップ予報用） ---
  const triggerFlash = () => {
    const el = document.getElementById('vfx-screen-overlay');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 100);
  };

  // --- 演出関数 5: コンボ音シミュレーション（シンセ音） ---
  const playComboSound = (count) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // コンボ数に応じて音程を上げる
    osc.frequency.setValueAtTime(440 + (count * 100), ctx.currentTime);
    osc.type = 'sine';
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#fff' }}>VFX 演出量産パネル 🧪</h1>

      <div id="vfx-screen-overlay" style={overlayStyle}></div>
      
      {/* --- セクション 1: 画面の揺れ --- */}
      <section style={sectionStyle}>
        <h3 style={labelStyle}>1. 画面の揺れ（ダメージ・爆発用）</h3>
        <button onClick={() => triggerShake('mild')} style={btnStyle}>マイルドな揺れ</button>
        <button onClick={() => triggerShake('strong')} style={{...btnStyle, backgroundColor: '#ff4757'}}>強烈な揺れ（ボム用）</button>
      </section>

      {/* --- セクション 2: パーティクル --- */}
      <section style={sectionStyle}>
        <h3 style={labelStyle}>2. パーティクル（消去・達成用）</h3>
        <button onClick={() => triggerConfetti('single')} style={{...btnStyle, backgroundColor: '#2ed573'}}>単発（消去音に合わせる）</button>
        <button onClick={() => triggerConfetti('multi')} style={{...btnStyle, backgroundColor: '#ffa502'}}>連発（レベルアップ！）</button>
      </section>

      {/* --- セクション 3: テキストポップアップ --- */}
      <section style={sectionStyle}>
        <h3 style={labelStyle}>3. スコア演出（コンボ・加点用）</h3>
        <button onClick={() => addPopup('+100 pts!')} style={{...btnStyle, backgroundColor: '#1e90ff'}}>スコア上昇</button>
        <button onClick={() => addPopup('GREAT!!')} style={{...btnStyle, backgroundColor: '#5352ed'}}>褒め言葉</button>
      </section>

      {/* --- セクション 4: 画面効果と音 --- */}
      <section style={sectionStyle}>
        <h3 style={labelStyle}>4. システム演出（警告・コンボ）</h3>
        <button onClick={triggerFlash} style={{...btnStyle, backgroundColor: '#eb4d4b'}}>画面フラッシュ（警告）</button>
        <button onClick={() => playComboSound(1)} style={{...btnStyle, backgroundColor: '#686de0'}}>音テスト(低)</button>
        <button onClick={() => playComboSound(5)} style={{...btnStyle, backgroundColor: '#4834d4'}}>音テスト(高)</button>
      </section>

      {/* スコアがふわっと出る場所（バックグラウンドで管理） */}
      <AnimatePresence>
        {popups.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -100 }}
            exit={{ opacity: 0 }}
            style={popupStyle}
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* --- 隠し味：CSSアニメーション（バックグラウンド側） --- */}
      <style>{`
        @keyframes shake-mild {
          0% { transform: translate(1px, 1px); }
          50% { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes shake-strong {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

// --- スタイル定義（見た目） ---
const containerStyle = { backgroundColor: '#2f3542', height: '100vh', padding: '20px', textAlign: 'center' };
const sectionStyle = { border: '1px solid #57606f', borderRadius: '10px', padding: '15px', margin: '10px auto', maxWidth: '500px' };
const labelStyle = { color: '#ced6e0', fontSize: '14px' };
const btnStyle = { margin: '5px', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: 'bold' };
const popupStyle = { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', color: '#7bed9f', fontSize: '2rem', fontWeight: 'bold', pointerEvents: 'none' };
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(255, 0, 0, 0.3)', display: 'none', pointerEvents: 'none', zIndex: 999
};

export default App;