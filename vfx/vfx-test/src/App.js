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

  // === 【フェーズ3：特殊ギミック・スキル系エフェクト（全21種）】 ===

  // 3-1. ボム・爆発（5種）
  const triggerBomb = (type) => {
    const el = document.getElementById('target-block-skill');
    el.className = `vfx-block target-block bomb-${type}`;
    if (type === 'mega') {
      triggerShake('strong');
      confetti({ particleCount: 200, spread: 360, startVelocity: 50, colors: ['#ff0000', '#ffa500', '#ffff00'] });
    } else if (type === 'blackhole') {
      // 0.5秒吸い込んでから爆発！
      setTimeout(() => {
        triggerShake('strong');
        confetti({ particleCount: 150, spread: 360, startVelocity: 60, zIndex: 1000, colors: ['#8a2be2', '#000000', '#ffffff'] });
      }, 500);
    } else {
      triggerShake('mild');
      confetti({ particleCount: 80, spread: 180, colors: ['#ff4757', '#ffffff'] });
    }
    setTimeout(() => { el.className = 'vfx-block target-block'; }, 800);
  };

  // 3-2. ラインクリア（5種：レーザーやウェーブ）
  const triggerLineClear = (type) => {
    const el = document.getElementById('target-block-skill');
    el.className = `vfx-block target-block line-${type}`;
    triggerShake('mild');
    setTimeout(() => { el.className = 'vfx-block target-block'; }, 600);
  };

  // 3-3. シャッフル・盤面攪乱（3種）
  const triggerShuffle = (type) => {
    const el = document.getElementById('target-block-skill');
    el.className = `vfx-block target-block shuffle-${type}`;
    setTimeout(() => { el.className = 'vfx-block target-block'; }, 1000);
  };

  // 3-4. ロック・お邪魔（4種：氷、石、鎖など）
  const triggerLock = (type) => {
    const el = document.getElementById('target-block-skill');
    el.className = `vfx-block target-block lock-${type}`;
    // ロックは実験として2秒間維持する
    setTimeout(() => { el.className = 'vfx-block target-block'; }, 2000);
  };

  // 3-5. ゲージ充填・チャージ（4種）
  const triggerCharge = (type) => {
    const el = document.getElementById('target-block-skill');
    el.className = `vfx-block target-block charge-${type}`;
    setTimeout(() => { el.className = 'vfx-block target-block'; }, 1500);
  };


  // === 【フェーズ4：システム・環境系エフェクト（全15種）】 ===

  // 4-1. 開始演出（3種：Ready Go, カウントダウン, カーテン）
  const triggerStart = (type) => {
    const el = document.getElementById('system-text-container');
    if(type === 'ready-go') {
      el.innerHTML = '<div class="sys-ready">READY...</div>';
      setTimeout(() => {
        el.innerHTML = '<div class="sys-go">GO!</div>';
        confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 }, colors: ['#ff4757', '#ffffff']});
        triggerShake('mild');
        setTimeout(() => { el.innerHTML = ''; }, 1000);
      }, 1500);
    } else if (type === 'countdown') {
      let count = 3;
      el.innerHTML = `<div class="sys-count">${count}</div>`;
      const timer = setInterval(() => {
        count--;
        if(count > 0) { el.innerHTML = `<div class="sys-count">${count}</div>`; }
        else if(count === 0) {
          el.innerHTML = '<div class="sys-go" style="color:#2ed573;">START!</div>';
          triggerConfetti('mega');
        } else { clearInterval(timer); el.innerHTML = ''; }
      }, 800);
    } else if (type === 'curtain') {
      el.innerHTML = '<div class="sys-curtain-left"></div><div class="sys-curtain-right"></div>';
      setTimeout(() => { el.innerHTML = ''; }, 1200);
    }
  };

  // 4-2. タイムアップ・警告（3種：赤枠点滅など）
  const triggerWarning = (type) => {
    const el = document.getElementById('vignette-overlay');
    if(type === 'on') el.className = 'vignette-pulse'; // ゆっくり点滅（残り1分）
    else if(type === 'fast') el.className = 'vignette-pulse-fast'; // 高速点滅（残り10秒）
    else el.className = ''; // 警告解除
  };

  // 4-3. クリア・勝利（3種）
  const triggerVictory = (type) => {
    const el = document.getElementById('system-text-container');
    if (type === 'clear') {
      el.innerHTML = '<div class="sys-victory">STAGE CLEAR</div>';
      triggerConfetti('multi');
    } else if (type === 'perfect') {
      el.innerHTML = '<div class="sys-perfect">PERFECT!!</div>';
      triggerShake('strong');
      confetti({ particleCount: 300, spread: 360, origin: { y: 0.4 }, colors: ['#feca57', '#ff9f43', '#ffffff'] });
    } else if (type === 'timeup') {
      el.innerHTML = '<div class="sys-timeup">TIME UP</div>';
      triggerShake('mild');
    }
    setTimeout(() => { el.innerHTML = ''; }, 3000);
  };

  // 4-4. ランクアップ・報酬（2種）
  const triggerReward = (type) => {
    const el = document.getElementById('system-text-container');
    if (type === 'treasure') {
       el.innerHTML = '<div class="sys-treasure">🎁<br/><span style="font-size: 20px;">GET!</span></div>';
       setTimeout(() => {
          el.innerHTML = '<div class="sys-treasure-open">✨💎✨<br/><span style="font-size: 20px;">RARE ITEM!</span></div>';
          confetti({ particleCount: 150, spread: 360, zIndex: 2000 });
       }, 1200);
    } else if (type === 'rankup') {
       el.innerHTML = '<div class="sys-rankup">RANK UP!</div>';
       triggerConfetti('mega');
    }
    setTimeout(() => { el.innerHTML = ''; }, 3000);
  };

  // 4-5. 背景の揺らぎ・環境（4種）
  const toggleBackground = (type) => {
    const el = document.getElementById('bg-effect-layer');
    if(type === 'cyber') el.className = 'bg-cyber';
    else if(type === 'magic') el.className = 'bg-magic';
    else if(type === 'danger') el.className = 'bg-danger';
    else el.className = '';
  };

  return (
    <div style={containerStyle}>
      {/* 背景エフェクト層（一番奥） */}
      <div id="bg-effect-layer" style={bgLayerStyle}></div>
      
      <h1 style={{ color: '#fff', position: 'relative', zIndex: 10 }}>VFX 演出量産パネル 🧪</h1>
      
      {/* 警告用赤枠（手前） */}
      <div id="vignette-overlay" style={vignetteStyle}></div>
      
      {/* システム文字用（一番手前） */}
      <div id="system-text-container" style={sysTextStyle}></div>


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


      {/* === フェーズ3：特殊ギミック・スキル系の実験 === */}
      <section style={sectionStyle}>
        <h3 style={{...labelStyle, color: '#e056fd'}}>フェーズ3：必殺技・特殊ギミック（スキル）</h3>
        
        {/* 実験用の的2（スキル用ターゲットブロック） */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0' }}>
          <div id="target-block-skill" className="vfx-block target-block" style={{ width: '80px', height: '80px', fontSize: '14px', position: 'relative' }}>Skill</div>
        </div>

        <div style={{ textAlign: 'left', fontSize: '12px', color: '#ccc' }}>
          <p>▼ 3-1. ボム・特殊爆発</p>
          <button onClick={() => triggerBomb('cross')} style={btnStyle}>十字爆発</button>
          <button onClick={() => triggerBomb('mega')} style={btnStyle}>メガボム</button>
          <button onClick={() => triggerBomb('blackhole')} style={btnStyle}>ﾌﾞﾗｯｸﾎｰﾙ</button>
          <button onClick={() => triggerBomb('firework')} style={btnStyle}>花火連発</button>
          <button onClick={() => triggerBomb('x-burst')} style={btnStyle}>Xバースト</button>

          <p>▼ 3-2. ラインクリア（一列消去）</p>
          <button onClick={() => triggerLineClear('horiz')} style={btnStyle}>水平レーザー</button>
          <button onClick={() => triggerLineClear('vert')} style={btnStyle}>垂直レーザー</button>
          <button onClick={() => triggerLineClear('cross-laser')} style={btnStyle}>十字レーザー</button>
          <button onClick={() => triggerLineClear('slash')} style={btnStyle}>斜め斬撃</button>
          <button onClick={() => triggerLineClear('wave')} style={btnStyle}>水波(ウェーブ)</button>

          <p>▼ 3-3. シャッフル（盤面攪乱）</p>
          <button onClick={() => triggerShuffle('tornado')} style={btnStyle}>竜巻</button>
          <button onClick={() => triggerShuffle('flip')} style={btnStyle}>フリップ</button>
          <button onClick={() => triggerShuffle('bounce')} style={btnStyle}>大バウンス</button>

          <p>▼ 3-4. ロック・お邪魔（状態異常）</p>
          <button onClick={() => triggerLock('ice')} style={{...btnStyle, background: '#7efff5', color: '#000'}}>氷結(Ice)</button>
          <button onClick={() => triggerLock('stone')} style={{...btnStyle, background: '#a4b0be', color: '#000'}}>石化(Stone)</button>
          <button onClick={() => triggerLock('chain')} style={{...btnStyle, background: '#747d8c'}}>鎖(Chain)</button>
          <button onClick={() => triggerLock('slime')} style={{...btnStyle, background: '#badc58', color: '#000'}}>粘液(Slime)</button>

          <p>▼ 3-5. ゲージ充填（チャージ・準備）</p>
          <button onClick={() => triggerCharge('aura')} style={{...btnStyle, background: '#feca57', color: '#000'}}>黄金オーラ</button>
          <button onClick={() => triggerCharge('sparkle')} style={{...btnStyle, background: '#ffbe76', color: '#000'}}>星の集積</button>
          <button onClick={() => triggerCharge('pulse')} style={{...btnStyle, background: '#ff7979'}}>脈動チャージ</button>
          <button onClick={() => triggerCharge('overheat')} style={{...btnStyle, background: '#eb4d4b'}}>オーバーヒート</button>
        </div>
      </section>


      {/* === フェーズ4：システム・環境系の実験 === */}
      <section style={{...sectionStyle, position: 'relative', zIndex: 10}}>
        <h3 style={{...labelStyle, color: '#feca57'}}>フェーズ4：システムと環境（全体演出）</h3>
        
        <div style={{ textAlign: 'left', fontSize: '12px', color: '#ccc' }}>
          <p>▼ 4-1. 開始演出</p>
          <button onClick={() => triggerStart('ready-go')} style={btnStyle}>Ready Go!</button>
          <button onClick={() => triggerStart('countdown')} style={btnStyle}>3,2,1 カウント</button>
          <button onClick={() => triggerStart('curtain')} style={btnStyle}>幕開け</button>

          <p>▼ 4-2. タイムアップ警告（画面の縁が赤くなる）</p>
          <button onClick={() => triggerWarning('on')} style={{...btnStyle, background: '#eb4d4b'}}>警告オン(遅)</button>
          <button onClick={() => triggerWarning('fast')} style={{...btnStyle, background: '#ff3838'}}>警告オン(速)</button>
          <button onClick={() => triggerWarning('off')} style={btnStyle}>警告オフ</button>

          <p>▼ 4-3. 勝利・終了 ＆ 4-4. 報酬</p>
          <button onClick={() => triggerVictory('clear')} style={{...btnStyle, background: '#2ed573'}}>クリア</button>
          <button onClick={() => triggerVictory('perfect')} style={{...btnStyle, background: '#feca57', color: '#000'}}>PERFECT</button>
          <button onClick={() => triggerVictory('timeup')} style={{...btnStyle, background: '#57606f'}}>TIME UP</button>
          <button onClick={() => triggerReward('treasure')} style={{...btnStyle, background: '#a29bfe', color: '#000'}}>宝箱開封</button>
          <button onClick={() => triggerReward('rankup')} style={{...btnStyle, background: '#fd79a8', color: '#000'}}>ランクアップ</button>

          <p>▼ 4-5. 背景の環境効果</p>
          <button onClick={() => toggleBackground('cyber')} style={btnStyle}>サイバー(網目)</button>
          <button onClick={() => toggleBackground('magic')} style={btnStyle}>魔法(粒子)</button>
          <button onClick={() => toggleBackground('danger')} style={{...btnStyle, background: '#eb4d4b'}}>危険(赤波)</button>
          <button onClick={() => toggleBackground('off')} style={btnStyle}>背景オフ</button>
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


        
        /* --- フェーズ3：特殊ギミック・スキル系CSS --- */
        
        /* 3-1. ボム・爆発 */
        .bomb-cross { animation: bomb-cross 0.5s ease-out; box-shadow: 0 0 0 10px rgba(255,71,87,0.5); }
        @keyframes bomb-cross { 0% { transform: scale(1); } 50% { transform: scale(1.5); box-shadow: 0 0 50px 20px rgba(255,71,87,1); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,71,87,0); } }
        
        .bomb-mega { animation: bomb-mega 0.8s ease-out; }
        @keyframes bomb-mega { 0% { transform: scale(1); filter: brightness(1); } 30% { transform: scale(0.8); filter: brightness(2); } 50% { transform: scale(2.5); filter: brightness(3); opacity: 1; } 100% { transform: scale(1); filter: brightness(1); opacity: 1; } }

        .bomb-blackhole { animation: bomb-bh 1s ease-in-out; }
        @keyframes bomb-bh { 0% { transform: scale(1) rotate(0); border-radius: 12px; background-color: #3742fa; } 50% { transform: scale(0.1) rotate(720deg); border-radius: 50%; background-color: #000; box-shadow: 0 0 20px 10px rgba(138,43,226,0.8); } 100% { transform: scale(1) rotate(0); border-radius: 12px; background-color: #3742fa; } }

        .bomb-firework { animation: bomb-fw 0.6s ease-out infinite; }
        @keyframes bomb-fw { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.2); filter: hue-rotate(90deg); } 100% { transform: translateY(0) scale(1); } }

        .bomb-x-burst { animation: bomb-x 0.5s ease-out; }
        @keyframes bomb-x { 0% { transform: scale(1) rotate(45deg); } 50% { transform: scale(1.5) rotate(45deg); filter: contrast(2); } 100% { transform: scale(1) rotate(45deg); } }

        /* 3-2. ラインクリア（疑似要素でレーザーを描画） */
        .line-horiz::after { content: ''; position: absolute; top: 50%; left: -200%; width: 500%; height: 10px; background: #fff; box-shadow: 0 0 15px 5px #ff9ff3; transform: translateY(-50%); animation: laser-h 0.4s ease-out forwards; z-index: 10; }
        @keyframes laser-h { 0% { transform: translateY(-50%) scaleY(0); opacity: 1; } 50% { transform: translateY(-50%) scaleY(2); opacity: 1; } 100% { transform: translateY(-50%) scaleY(0); opacity: 0; } }

        .line-vert::after { content: ''; position: absolute; left: 50%; top: -200%; height: 500%; width: 10px; background: #fff; box-shadow: 0 0 15px 5px #00d2d3; transform: translateX(-50%); animation: laser-v 0.4s ease-out forwards; z-index: 10; }
        @keyframes laser-v { 0% { transform: translateX(-50%) scaleX(0); opacity: 1; } 50% { transform: translateX(-50%) scaleX(2); opacity: 1; } 100% { transform: translateX(-50%) scaleX(0); opacity: 0; } }

        .line-cross-laser::before { content: ''; position: absolute; top: 50%; left: -200%; width: 500%; height: 8px; background: #feca57; transform: translateY(-50%); animation: laser-h 0.5s ease-out forwards; z-index: 10; }
        .line-cross-laser::after { content: ''; position: absolute; left: 50%; top: -200%; height: 500%; width: 8px; background: #feca57; transform: translateX(-50%); animation: laser-v 0.5s ease-out forwards; z-index: 10; }

        .line-slash::after { content: ''; position: absolute; top: 50%; left: -100%; width: 300%; height: 5px; background: #fff; box-shadow: 0 0 10px #ff6b6b; transform: translateY(-50%) rotate(45deg); animation: slash 0.3s ease-in forwards; z-index: 10; }
        @keyframes slash { 0% { opacity: 0; width: 0; left: 50%; } 50% { opacity: 1; width: 300%; left: -100%; } 100% { opacity: 0; } }

        .line-wave { animation: wave-anim 0.5s linear; }
        @keyframes wave-anim { 0% { transform: translateX(0) scaleY(1); } 25% { transform: translateX(-15px) scaleY(1.3); background-color: #48dbfb; } 75% { transform: translateX(15px) scaleY(0.7); background-color: #0abde3; } 100% { transform: translateX(0) scaleY(1); } }

        /* 3-3. シャッフル */
        .shuffle-tornado { animation: tornado 0.8s ease-in-out forwards; }
        @keyframes tornado { 0% { transform: rotate(0) scale(1); } 50% { transform: rotate(1080deg) scale(0.5); opacity: 0.5; } 100% { transform: rotate(2160deg) scale(1); opacity: 1; } }

        .shuffle-flip { animation: flip 0.6s ease-in-out forwards; }
        @keyframes flip { 0% { transform: perspective(400px) rotateY(0); } 50% { transform: perspective(400px) rotateY(180deg) scale(1.2); } 100% { transform: perspective(400px) rotateY(360deg); } }

        .shuffle-bounce { animation: shuffle-bounce 0.8s ease-in-out forwards; }
        @keyframes shuffle-bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-40px) translateX(-20px); } 50% { transform: translateY(0) translateX(20px); } 75% { transform: translateY(-20px) translateX(0); } }

        /* 3-4. ロック・お邪魔（疑似要素で上書き） */
        .lock-ice::after { content: ''; position: absolute; inset: -5px; background: rgba(200, 247, 255, 0.6); border: 3px solid #00d2d3; border-radius: 4px; box-shadow: inset 0 0 10px #fff; pointer-events: none; animation: freeze 2s forwards; }
        @keyframes freeze { 0% { opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }

        .lock-stone { animation: stone 2s forwards; }
        @keyframes stone { 0% { filter: grayscale(0); } 10% { filter: grayscale(1) sepia(0.2); background-color: #7f8fa6; } 90% { filter: grayscale(1) sepia(0.2); background-color: #7f8fa6; } 100% { filter: grayscale(0); } }

        .lock-chain::before { content: '🔗'; position: absolute; font-size: 40px; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 5; animation: chain 2s forwards; }
        @keyframes chain { 0% { opacity: 0; transform: translate(-50%, -50%) scale(2); } 10% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 90% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); } }

        .lock-slime::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 100%; background: linear-gradient(transparent, rgba(172, 216, 100, 0.8)); border-radius: 12px; animation: slime-drip 2s forwards; }
        @keyframes slime-drip { 0% { height: 0%; opacity: 0; } 10% { height: 100%; opacity: 1; } 90% { height: 100%; opacity: 1; } 100% { height: 0%; opacity: 0; } }

        /* 3-5. ゲージ充填・オーラ */
        .charge-aura { animation: aura 1.5s ease-in-out; box-shadow: 0 0 20px 10px #feca57; }
        @keyframes aura { 0%, 100% { box-shadow: 0 0 10px 5px #feca57; } 50% { box-shadow: 0 0 40px 20px #ff9f43; background-color: #feca57; } }

        .charge-sparkle::after { content: '✨'; position: absolute; top: -10px; right: -10px; font-size: 24px; animation: sparkle 1.5s infinite; }
        .charge-sparkle::before { content: '✨'; position: absolute; bottom: -10px; left: -10px; font-size: 20px; animation: sparkle 1.5s infinite alternate-reverse; }
        @keyframes sparkle { 0% { opacity: 0; transform: scale(0.5) rotate(0); } 50% { opacity: 1; transform: scale(1.5) rotate(180deg); } 100% { opacity: 0; transform: scale(0.5) rotate(360deg); } }

        .charge-pulse { animation: charge-pulse 1.5s ease-in-out; }
        @keyframes charge-pulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.1); filter: brightness(1.5); box-shadow: 0 0 15px #ff5252; } }

        .charge-overheat { animation: overheat 1.5s forwards; }
        @keyframes overheat { 0% { background-color: #3742fa; } 30% { background-color: #ff5252; box-shadow: 0 0 10px #ff5252; } 70% { background-color: #ff3838; box-shadow: 0 0 30px #ff3838; transform: translate(2px, -2px); } 100% { background-color: #3742fa; } }


        /* --- フェーズ4：システム・環境系CSS --- */
        
        /* 4-1 & 4-3 & 4-4: テキスト演出 */
        .sys-ready { font-size: 50px; color: #fff; text-shadow: 0 0 20px #0abde3; animation: pop-in 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .sys-go { font-size: 80px; color: #ff4757; text-shadow: 0 0 30px #ff4757; font-weight: 900; animation: blast-out 1s ease-out forwards; }
        .sys-count { font-size: 100px; color: #feca57; animation: count-ping 0.8s ease-out forwards; }
        .sys-victory { font-size: 60px; color: #2ed573; text-shadow: 0 0 20px #2ed573; animation: slide-in-bounce 1s forwards; background: rgba(0,0,0,0.5); padding: 20px 100vw; }
        .sys-perfect { font-size: 70px; color: #feca57; font-style: italic; letter-spacing: 5px; animation: perfect-shine 2s forwards; }
        .sys-timeup { font-size: 60px; color: #747d8c; text-shadow: 4px 4px 0 #000; animation: drop-down 0.5s forwards; }
        .sys-treasure, .sys-treasure-open { font-size: 50px; text-align: center; color: white; animation: float-up 1s forwards; }
        .sys-treasure { animation: wobble 1s infinite; }
        .sys-rankup { font-size: 70px; color: #fd79a8; text-shadow: 0 0 20px #fd79a8; animation: scale-up-fade 2s forwards; }

        @keyframes pop-in { 0% { transform: scale(3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes blast-out { 0% { transform: scale(0.5); opacity: 1; } 20% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes count-ping { 0% { transform: scale(2); opacity: 0; } 20% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.5); opacity: 0; } }
        @keyframes slide-in-bounce { 0% { transform: translateX(-100vw) skewX(-20deg); } 60% { transform: translateX(20px) skewX(0); } 100% { transform: translateX(0); } }
        @keyframes perfect-shine { 0% { filter: brightness(1) drop-shadow(0 0 0 #feca57); transform: scale(0.8); } 50% { filter: brightness(2) drop-shadow(0 0 50px #feca57); transform: scale(1.1); } 100% { filter: brightness(1); transform: scale(1); opacity: 0; } }

        /* 幕開け演出 */
        .sys-curtain-left, .sys-curtain-right { position: absolute; top: 0; width: 50vw; height: 100vh; background: #000; z-index: 1999; }
        .sys-curtain-left { left: 0; animation: curtain-l 1.2s ease-in-out forwards; }
        .sys-curtain-right { right: 0; animation: curtain-r 1.2s ease-in-out forwards; }
        @keyframes curtain-l { 0%, 20% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        @keyframes curtain-r { 0%, 20% { transform: translateX(0); } 100% { transform: translateX(100%); } }

        /* 4-2. タイムアップ警告（ビネット） */
        .vignette-pulse { box-shadow: inset 0 0 100px 20px rgba(255, 0, 0, 0); animation: vig-pulse 2s infinite; }
        .vignette-pulse-fast { box-shadow: inset 0 0 150px 40px rgba(255, 0, 0, 0); animation: vig-pulse 0.5s infinite; }
        @keyframes vig-pulse { 0%, 100% { box-shadow: inset 0 0 50px 0px rgba(255, 0, 0, 0); } 50% { box-shadow: inset 0 0 150px 30px rgba(235, 77, 75, 0.8); } }

        /* 4-5. 背景環境 */
        .bg-cyber { background: linear-gradient(transparent 95%, rgba(0, 210, 211, 0.3) 100%), linear-gradient(90deg, transparent 95%, rgba(0, 210, 211, 0.3) 100%); background-size: 40px 40px; animation: bg-scroll 2s linear infinite; }
        @keyframes bg-scroll { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        
        .bg-danger { background: radial-gradient(circle at 50% 50%, #1e1e1e 0%, #eb4d4b 150%); animation: bg-breathe 2s infinite alternate; }
        @keyframes bg-breathe { from { opacity: 0.5; } to { opacity: 1; } }

        .bg-magic { background-image: radial-gradient(rgba(255, 255, 255, 0.1) 2px, transparent 2px); background-size: 30px 30px; animation: magic-float 10s linear infinite; }
        @keyframes magic-float { from { background-position: 0 0; } to { background-position: 100px -100px; } }
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