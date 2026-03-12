// 効果音のインスタンスを準備
// ※ public フォルダ直下に sounds フォルダを作り、そこに mp3 を入れてください
const sounds = {
  pop: new Audio('/sounds/pop.mp3'),
  bomb: new Audio('/sounds/explosion.mp3')
};

// 音量調整
Object.values(sounds).forEach(audio => {
  audio.volume = 0.5;
});

export const playSound = (type) => {
  const audio = sounds[type];
  if (audio) {
    audio.currentTime = 0; // 連続タップしても最初から鳴るようにする
    audio.play().catch(e => console.warn('Audio skipped:', e));
  }
};