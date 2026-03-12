import anime from 'animejs';

export const shakeScreen = (isBomb = false) => {
  // ボムの時は激しく、通常の時は軽く揺らす
  const intensity = isBomb ? 15 : 4;
  
  anime({
    targets: '.game-container', // 後でPuzzleBoardの親divにこのクラスを付けます
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