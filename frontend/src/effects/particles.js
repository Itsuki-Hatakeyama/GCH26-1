// src/effects/particles.js

// 🌟🌟 【追加】テキスト（数字）を浮かび上がらせるクラス 🌟🌟
class PopupText {
  constructor(x, y, text, color, isBomb) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    
    // 真上にフワッと浮かぶ速度（ボムの時は少し速く）
    this.vy = isBomb ? -3 : -2;
    // 寿命 (1.0 -> 0.0で消滅)
    this.life = 1.0; 
    // 消えるスピード
    this.decay = Math.random() * 0.01 + 0.01; 
  }

  update() {
    this.y += this.vy; // 上に移動
    this.life -= this.decay; // 寿命を減らす
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life); // 透明度
    ctx.fillStyle = this.color;
    
    // 🌟 グロー（発光）効果
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    
    // 🌟 フォントの設定（VT323をCanvasに適用）
    // サイズを消した数に応じて、大きく変化させる
    const baseSize = 40;
    const numericText = Number(this.text) || 0;
    const size = baseSize + Math.min(numericText * 8, 100); // 変化量と最大サイズを拡大
    ctx.font = `${size}px "VT323", cursive`;
    ctx.textAlign = 'center'; // 中央揃え
    ctx.textBaseline = 'middle'; // 上下中央揃え
    // テキストの描画
    ctx.fillText(this.text, this.x, this.y);
  }
}

class Particle {
  constructor(x, y, color, isBomb) {
    this.x = x;
    this.y = y;
    this.color = color;
    // ランダムな方向に飛ばす
    const angle = Math.random() * Math.PI * 2;
    const speed = isBomb ? Math.random() * 15 + 5 : Math.random() * 8 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.life = 1.0; // 透明度 (1.0 -> 0.0で消滅)
    this.decay = Math.random() * 0.03 + 0.02; // 消えるスピード
    this.size = isBomb ? Math.random() * 6 + 4 : Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // 重力（下に向かって落ちる）
    this.life -= this.decay;
    this.size *= 0.96; // だんだん小さくなる
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    // 🌟 グロー（発光）効果
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    // 🌟🌟 【追加】浮かび上がるテキストを管理する配列 🌟🌟
    this.popups = []; 
    this.isInitialized = false;
  }

  // Reactコンポーネントがマウントされた時に呼ばれる
  init() {
    if (this.isInitialized || document.getElementById('effect-canvas')) return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'effect-canvas';
    this.ctx = this.canvas.getContext('2d');
    
    // 画面全体を覆う、クリックをすり抜ける透明なCanvas
    Object.assign(this.canvas.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '9999'
    });
    
    document.body.appendChild(this.canvas);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.isInitialized = true;
    this.loop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  emit(x, y, color, isBomb = false) {
    const count = isBomb ? 80 : 25;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, isBomb));
      // 🌟 白いコア（芯）を混ぜることで、より「光っている」ように見せる
      if (i % 3 === 0) {
        this.particles.push(new Particle(x, y, '#ffffff', isBomb));
      }
    }
  }

  // 🌟🌟 【追加】テキスト（数字）を浮かび上がらせる関数 🌟🌟
  emitText(x, y, text, color, isBomb = false) {
    this.popups.push(new PopupText(x, y, text, color, isBomb));
    
    // 🌟 ボムの時は特別にテキスト自体からもパーティクルを出すとリッチ
    if (isBomb) {
      for (let i = 0; i < 20; i++) {
        this.particles.push(new Particle(x, y, '#ffffff', false)); // 白い小さな火花
      }
    }
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    if (!this.ctx) return;

    // Canvasをクリア（透明にする）
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 🌟 加算合成（重なった部分が白く飛ぶ）
    this.ctx.globalCompositeOperation = 'lighter';
    
    // 1. パーティクルの更新と描画
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(this.ctx);
      if (p.life <= 0 || p.size <= 0.1) {
        this.particles.splice(i, 1);
      }
    }
    
    // 🌟🌟 【追加】2. テキスト（ポップアップ）の更新と描画 🌟🌟
    // Canvasの設定を一度リセット（影などの設定をPopupTextのdraw内で改めて行うため）
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = 'transparent';
    
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.update();
      p.draw(this.ctx);
      if (p.life <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }
}

export const particleEngine = new ParticleSystem();