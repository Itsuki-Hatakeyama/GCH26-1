// src/effects/animations.js
// 🌟 'anime' ではなく 'animate' をインポートする
import { animate } from 'animejs';

export const shakeScreen = (isBomb = false) => {
  const intensity = isBomb ? 15 : 4;
  
  // 🌟 関数名も animate に変更
  animate({
    targets: '.game-container',
    translateX: [
      { value: -intensity, duration: 40 },
      { value: intensity, duration: 40 },
      { value: -intensity / 2, duration: 40 },
      { value: intensity / 2, duration: 40 },
      { value: 0, duration: 40 }
    ],
    translateY: isBomb ? [
      { value: -intensity, duration: 40 },
      { value: intensity, duration: 40 },
      { value: 0, duration: 40 }
    ] : 0,
    easing: 'easeInOutSine'
  });
};