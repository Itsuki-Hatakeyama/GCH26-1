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

  // === 【フェーズ2：状態変化・消滅系エフェクト（全17種）】 ===

  // 2-1. マッチ成立（3つ揃った瞬間のフラッシュ：3種）
  const triggerMatchFlash = (type) => {
    const el = document.getElementById('target-block');
    el.className = `vfx-block target-block match-${type}`;
    setTimeout(() => { el.className = 'vfx-block target-block'; }, 400);
  };

  // 2-2. 消滅・バースト（ブロックが消える時のアニメーション：4種）
  const triggerBurstAnim = (type) => {
    const el = document.getElementById('target-block');
    el.className = `vfx-block target-block burst-${type}`;
    // 消えた後、元に戻す（実験用）
    setTimeout(() => { el.className = 'vfx-block target-block'; }, 600);
  };

  // 2-3. 属性・色別パーティクル（物理演算付きの破片：5種）
  const triggerElementalBurst = (element) => {
    const defaults = { origin: { y: 0.5 }, zIndex: 1000 };
    switch (element) {
      case 'fire': // 火：上に舞い上がる赤とオレンジ
        confetti({ ...defaults, particleCount: 60, spread: 80, gravity: -0.2, colors: ['#ff4757', '#ffa502', '#ff6348'] });
        break;
      case 'water': // 水：重力で落ちる青い飛沫
        confetti({ ...defaults, particleCount: 80, spread: 100, gravity: 1.5, startVelocity: 20, colors: ['#1e90ff', '#70a1ff', '#ffffff'] });
        break;
      case 'thunder': // 雷：超高速で散る黄色と白
        confetti({ ...defaults, particleCount: 30, spread: 360, startVelocity: 60, decay: 0.9, colors: ['#eccc68', '#ffffff'] });
        break;
      case 'wind': // 風：フワッと横に広がる緑
        confetti({ ...defaults, particleCount: 50, spread: 120, gravity: 0.1, decay: 0.96, colors: ['#2ed573', '#7bed9f'] });
        break;
      case 'dark': // 闇：ドロッと落ちる紫と黒
        confetti({ ...defaults, particleCount: 40, spread: 40, gravity: 0.8, ticks: 100, colors: ['#3742fa', '#2f3542', '#57606f'] });
        break;
      default:
        break;
    }
  };

  // 2-4. 落下・着地（土煙と揺れ：2種）
  const triggerDrop = (weight) => {
    const el = document.getElementById('target-block');
    el.className = `vfx-block target-block drop-anim`;
    
    setTimeout(() => {
      // 着地した瞬間のエフェクト
      if (weight === 'heavy') {
        triggerShake('strong'); // フェーズ1で作った揺れを再利用！
        confetti({ particleCount: 40, spread: 90, startVelocity: 15, gravity: 2, origin: { y: 0.55 }, colors: ['#747d8c', '#a4b0be'] }); // 土煙
      } else {
        confetti({ particleCount: 15, spread: 50, startVelocity: 10, gravity: 1.5, origin: { y: 0.55 }, colors: ['#ffffff'] }); // 軽いチリ
      }
      el.className = 'vfx-block target-block';
    }, 300); // 落下にかかる時間（0.3秒）後に発動
  };

  // 2-5. コンボカウント演出（3種）
  const triggerComboNumber = (count) => {
    let text = `${count} COMBO!`;
    let type = 'normal';
    if (count >= 5) { text = `🔥 ${count} COMBO!! 🔥`; type = 'high'; }
    if (count >= 10) { text = `⚡️ ${count} MEGA COMBO ⚡️`; type = 'mega'; }

    const id = Date.now();
    // 既存のaddPopupを拡張して、種類(type)も持たせる
    setPopups([...popups, { id, text, type }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1500);
    playComboSound(count); // フェーズ1の音を鳴らす
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

      {/* === フェーズ2：状態変化・消滅系の実験 === */}
      <section style={sectionStyle}>
        <h3 style={{...labelStyle, color: '#2ed573'}}>フェーズ2：消滅と状態変化（バースト）</h3>
        
        {/* 実験用の的（ターゲットブロック） */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <div id="target-block" className="vfx-block target-block" style={{ width: '80px', height: '80px', fontSize: '14px' }}>Target</div>
        </div>

        <div style={{ textAlign: 'left', fontSize: '12px', color: '#ccc' }}>
          <p>▼ 2-1. マッチ成立（光り方）</p>
          <button onClick={() => triggerMatchFlash('white')} style={btnStyle}>白閃光</button>
          <button onClick={() => triggerMatchFlash('invert')} style={btnStyle}>色反転</button>
          <button onClick={() => triggerMatchFlash('aura')} style={btnStyle}>オーラ</button>

          <p>▼ 2-2. 消滅アニメーション（形）</p>
          <button onClick={() => triggerBurstAnim('pop')} style={btnStyle}>ポップ</button>
          <button onClick={() => triggerBurstAnim('melt')} style={btnStyle}>溶解</button>
          <button onClick={() => triggerBurstAnim('implode')} style={btnStyle}>爆縮(吸込)</button>
          <button onClick={() => triggerBurstAnim('fly')} style={btnStyle}>飛翔</button>

          <p>▼ 2-3. 属性パーティクル（色と軌道）</p>
          <button onClick={() => triggerElementalBurst('fire')} style={{...btnStyle, background: '#ff4757'}}>火(上)</button>
          <button onClick={() => triggerElementalBurst('water')} style={{...btnStyle, background: '#1e90ff'}}>水(下)</button>
          <button onClick={() => triggerElementalBurst('wind')} style={{...btnStyle, background: '#2ed573'}}>風(横)</button>
          <button onClick={() => triggerElementalBurst('thunder')} style={{...btnStyle, background: '#ffa502'}}>雷(速)</button>
          <button onClick={() => triggerElementalBurst('dark')} style={{...btnStyle, background: '#3742fa'}}>闇(重)</button>

          <p>▼ 2-4. 落下・着地 ＆ 2-5. コンボ</p>
          <button onClick={() => triggerDrop('light')} style={btnStyle}>通常落下</button>
          <button onClick={() => triggerDrop('heavy')} style={{...btnStyle, background: '#747d8c'}}>重量落下(+揺れ)</button>
          <button onClick={() => triggerComboNumber(2)} style={btnStyle}>2コンボ</button>
          <button onClick={() => triggerComboNumber(6)} style={{...btnStyle, background: '#ff7f50'}}>6コンボ</button>
          <button onClick={() => triggerComboNumber(12)} style={{...btnStyle, background: '#ff4757'}}>12コンボ</button>
        </div>
      </section>

      {/* スコアがふわっと出る場所（バックグラウンドで管理） */}
      <AnimatePresence>
        {popups.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: p.type === 'mega' ? 1.5 : (p.type === 'high' ? 1.2 : 1), y: -100 }}
            exit={{ opacity: 0, scale: 2 }}
            style={{
              ...popupStyle,
              color: p.type === 'mega' ? '#ffd32a' : (p.type === 'high' ? '#ff3f34' : '#0be881'),
              textShadow: p.type === 'mega' ? '0 0 20px #ff3f34' : '2px 2px 4px rgba(0,0,0,0.5)',
              fontStyle: p.type === 'normal' ? 'normal' : 'italic'
            }}
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



        /* --- フェーズ2用ターゲットブロック --- */
        .target-block { background-color: #9b59b6; transition: none; }

        /* 2-1. マッチ成立（フラッシュ） */
        .match-white { filter: brightness(3) contrast(0.5); transform: scale(1.1); }
        .match-invert { filter: invert(1); transform: scale(0.9); }
        .match-aura { box-shadow: 0 0 30px 10px rgba(155, 89, 182, 0.8); transform: scale(1.05); }

        /* 2-2. 消滅・バースト */
        .burst-pop { animation: burst-pop 0.3s forwards; }
        @keyframes burst-pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }

        .burst-melt { animation: burst-melt 0.4s forwards; }
        @keyframes burst-melt {
          0% { transform: scale(1, 1) translateY(0); opacity: 1; }
          100% { transform: scale(1.5, 0.2) translateY(20px); opacity: 0; }
        }

        .burst-implode { animation: burst-implode 0.5s forwards; }
        @keyframes burst-implode {
          0% { transform: scale(1) rotate(0); filter: blur(0); }
          50% { transform: scale(0.2) rotate(180deg); filter: blur(2px); }
          100% { transform: scale(2) rotate(360deg); opacity: 0; }
        }

        .burst-fly { animation: burst-fly 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
        @keyframes burst-fly {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.5) translateY(-100px); opacity: 0; }
        }

        /* 2-4. 落下・着地 */
        .drop-anim { animation: drop-down 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53); }
        @keyframes drop-down {
          0% { transform: translateY(-100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
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