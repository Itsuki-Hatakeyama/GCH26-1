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

  // === 【フェーズ1：操作・入力系エフェクト】 ===

  // 1-1. タップ波紋（画面のどこでも触れた感覚をフィードバック）
  const triggerRipple = (e) => {
    // ボタンのクリックイベントから座標を取得
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);
    // 1秒後に波紋のデータを消す
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);
  };

  // 1-2. 操作音（ピッチが少し変わるランダムなタップ音で無機質さを消す）
  const playTapSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // 800Hz〜1000Hzの間でランダムに音程を変え、機械的な印象をなくす（Juiceの基本）
    const randomPitch = 800 + Math.random() * 200;
    osc.frequency.setValueAtTime(randomPitch, ctx.currentTime);
    osc.type = 'triangle'; // 丸みのある音
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#fff' }}>VFX 演出量産パネル 🧪</h1>

      <div id="vfx-screen-overlay" style={overlayStyle}></div>


    {/* === フェーズ1：操作・入力系の実験 === */}
      <section style={sectionStyle}>
        <h3 style={{...labelStyle, color: '#ff7f50'}}>フェーズ1：操作の手触り（Juice）</h3>
        
        {/* 1. タップ波紋と音 */}
        <div style={{ position: 'relative', overflow: 'hidden', padding: '20px', border: '1px dashed #747d8c', marginBottom: '10px' }} onClick={(e) => { triggerRipple(e); playTapSound(); }}>
          ここをクリックして波紋と音をテスト
          {ripples.map((r) => (
             <div key={r.id} style={{
               position: 'absolute', left: r.x, top: r.y,
               transform: 'translate(-50%, -50%)',
               width: '20px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.7)',
               borderRadius: '50%', pointerEvents: 'none',
               animation: 'ripple-effect 0.6s ease-out forwards'
             }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px' }}>
          {/* 2. ホールド・選択（浮き上がりと発光） */}
          <div className="vfx-block hover-glow">掴む<br/>(Hover)</div>
          
          {/* 3. キャンセル戻り（拒絶のぷるん） */}
          <div className="vfx-block error-wobble" onClick={(e) => {
            e.target.classList.remove('active');
            void e.target.offsetWidth; // アニメーションのリセット
            e.target.classList.add('active');
          }}>拒絶<br/>(Click)</div>

          {/* 4. 着地の潰れ（スクワッシュ＆ストレッチ） */}
          <div className="vfx-block squash-stretch" onClick={(e) => {
            e.target.classList.remove('active');
            void e.target.offsetWidth;
            e.target.classList.add('active');
          }}>着地<br/>(Click)</div>

          {/* 5. 押し込みと反発（物理ボタンの沈み込み） */}
          <div className="vfx-block press-bounce">押込<br/>(Press)</div>

          {/* 6. 呼吸・脈動（生きているような明滅） */}
          <div className="vfx-block breathing" style={{ backgroundColor: '#e84118' }}>呼吸<br/>(Pulse)</div>

          {/* 7. スナップ＆フラッシュ（正しい位置にハマった時の完了合図） */}
          <div className="vfx-block snap-flash" style={{ position: 'relative' }} onClick={(e) => {
            e.target.classList.remove('active');
            void e.target.offsetWidth;
            e.target.classList.add('active');
          }}>密着<br/>(Click)</div>

          {/* 8. 壁への衝突（横方向へのベチャッという潰れ） */}
          <div className="vfx-block wall-bump" style={{ backgroundColor: '#00a8ff' }} onClick={(e) => {
            e.target.classList.remove('active');
            void e.target.offsetWidth;
            e.target.classList.add('active');
          }}>壁衝突<br/>(Click)</div>
        </div>
      </section>
      
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

        /* ブロックの基本スタイル */
        .vfx-block {
          width: 60px; height: 60px; background-color: #3742fa;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          color: white; font-size: 12px; font-weight: bold; cursor: pointer;
          transition: all 0.2s;
        }

        /* 1-1. 波紋エフェクト */
        @keyframes ripple-effect {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(5); opacity: 0; }
        }

        /* 1-2. ホールド・選択（浮遊して光る） */
        .hover-glow:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 10px 20px rgba(55, 66, 250, 0.6), 0 0 15px rgba(255, 255, 255, 0.5) inset;
          background-color: #5352ed;
        }

        /* 1-3. キャンセル戻り（エラー時の首振り） */
        .error-wobble.active { animation: wobble 0.4s ease-in-out; background-color: #ff4757; }
        @keyframes wobble {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px) rotate(-5deg); }
          40% { transform: translateX(6px) rotate(4deg); }
          60% { transform: translateX(-4px) rotate(-2deg); }
          80% { transform: translateX(2px) rotate(1deg); }
        }

        /* 1-4. 着地の潰れ（スクワッシュ＆ストレッチ） */
        .squash-stretch.active { animation: squash 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        @keyframes squash {
          0% { transform: scale(1, 1) translateY(-20px); }
          40% { transform: scale(1.3, 0.7) translateY(0); } /* 着地して潰れる */
          70% { transform: scale(0.8, 1.2) translateY(-5px); } /* 伸びて跳ね返る */
          100% { transform: scale(1, 1) translateY(0); }
        }
        
        /* 1-5. 押し込みと反発（Press & Bounce） */
        .press-bounce {
          /* 立体的な影をつけて物理ボタンっぽくする */
          box-shadow: 0 6px 0 #192a56; 
          transition: transform 0.1s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.1s;
        }
        .press-bounce:active {
          transform: translateY(4px) scale(0.95); /* 奥に押し込まれる */
          box-shadow: 0 2px 0 #192a56; /* 影が減る */
        }

        /* 1-6. 呼吸・脈動（Breathing Glow） */
        .breathing {
          animation: breathe 2s infinite ease-in-out;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 5px rgba(232, 65, 24, 0.2); }
          50% { transform: scale(1.08); box-shadow: 0 0 20px rgba(232, 65, 24, 0.8); }
        }

        /* 1-7. スナップ＆フラッシュ（Snap & Flash） */
        .snap-flash.active {
          animation: snap-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        /* 白い閃光用の疑似要素（オーバーレイ） */
        .snap-flash::after {
          content: ''; position: absolute; inset: 0; background: white;
          opacity: 0; border-radius: inherit; pointer-events: none;
        }
        .snap-flash.active::after {
          animation: white-flash 0.3s ease-out;
        }
        @keyframes snap-in {
          0% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes white-flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }

        /* 1-8. 壁への衝突（Wall Bump / 横方向の潰れ） */
        .wall-bump.active {
          animation: bump-right 0.3s ease-out;
          transform-origin: right center; /* 右側の壁にぶつかる想定 */
        }
        @keyframes bump-right {
          0% { transform: translateX(0) scale(1, 1); }
          40% { transform: translateX(10px) scale(0.7, 1.2); } /* 右に潰れる */
          70% { transform: translateX(10px) scale(1.1, 0.9); } /* 逆方向に跳ね返り */
          100% { transform: translateX(0) scale(1, 1); }
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