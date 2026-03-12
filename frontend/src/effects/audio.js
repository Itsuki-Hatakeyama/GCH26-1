// src/effects/audio.js

// ブラウザのWeb Audio APIを使って、ファイル無しで音を合成する準備
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

export const playSound = (type) => {
  // ユーザーがクリックするまでAudioContextは作れないルールがあるため、ここで初期化
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // ブラウザの制限で一時停止されている場合は再開する
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // 音の波と音量を作る
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'pop') {
    // 🌟 通常ブロック消去：「ピコッ！」という軽快な音
    oscillator.type = 'sine'; // 丸い波形
    oscillator.frequency.setValueAtTime(600, now); // 高めの音から
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1); // さらに高く跳ね上がる
    
    gainNode.gain.setValueAtTime(0.3, now); // 音量
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // すぐに小さくする
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);

  } else if (type === 'bomb') {
    // 💣 ボム使用：「ドゥーン！」という重い爆発音
    oscillator.type = 'square'; // 荒々しい波形
    oscillator.frequency.setValueAtTime(150, now); // 低音から
    oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.5); // さらに低く沈む
    
    gainNode.gain.setValueAtTime(0.4, now); // 音量
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // 余韻を残して消える
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }
};