// src/effects/audio.js

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// 🌟 変更：第2引数に combo = 0 を追加
export const playSound = (type, combo = 0) => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'pop') {
    // 🌟 コンボ数に応じてベースの音を高くする（1コンボにつき +100Hz）
    // 例: 0コンボ=600Hz, 3コンボ=900Hz, 最大1500Hzまで
    const baseFreq = Math.min(600 + (combo * 100), 1500); 

    oscillator.type = 'sine'; 
    oscillator.frequency.setValueAtTime(baseFreq, now); 
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.1); 
    
    gainNode.gain.setValueAtTime(0.3, now); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); 
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);

  } else if (type === 'bomb') {
    oscillator.type = 'square'; 
    oscillator.frequency.setValueAtTime(150, now); 
    oscillator.frequency.exponentialRampToValueAtTime(20, now + 0.5); 
    
    gainNode.gain.setValueAtTime(0.4, now); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); 
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }
};