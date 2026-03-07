import React, { useState, useEffect } from 'react';

// onBack という「ホームに戻るための関数」をApp.jsから受け取ります
export default function Timer({ onBack }) {
const FOCUS_TIME = 15;
const BREAK_TIME = 13;
const [seconds, setSeconds] = useState(FOCUS_TIME);
const [isActive, setIsActive] = useState(false);
const [isBreak, setIsBreak] = useState(false);

const totalTime = isBreak ? BREAK_TIME : FOCUS_TIME;
const progress = (seconds / totalTime) * 100;

useEffect(() => {
let interval = null;
if (isActive && seconds > 0) {
interval = setInterval(() => {
setSeconds(s => s - 1);
}, 1000);
} else if (seconds === 0) {
setIsActive(false);
if (!isBreak) {
alert("集中終了！休憩しましょう。（ここに後でボム獲得処理を入れます！）");
setIsBreak(true);
setSeconds(BREAK_TIME);
} else {
alert("休憩終了！さあ、始めましょう。");
setIsBreak(false);
setSeconds(FOCUS_TIME);
}
}
return () => clearInterval(interval);
}, [isActive, seconds, isBreak]);

const themeClass = isBreak ? 'theme-break' : 'theme-focus';

return (
<div className={`container ${themeClass}`}>
{/* 戻るボタンが押されたら、App.jsから貰った onBack 関数を実行する */}
<button className="btn-back" onClick={() => {
setIsActive(false);
onBack();
}}>
← HOME
</button>

<div className="timer-card" style={{ '--progress': `${progress}%` }}>
<h1 className="status-label">
{isBreak ? "☕️ RELAX" : "🎯 FOCUS"}
</h1>
<div className="timer-display">
{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
</div>
<div className="button-group">
<button className="btn start" onClick={() => setIsActive(!isActive)}>
{isActive ? 'PAUSE' : 'START'}
</button>
<button className="btn reset" onClick={() => {
setIsActive(false);
setSeconds(isBreak ? BREAK_TIME : FOCUS_TIME);
}}>
RESET
</button>
</div>
</div>
</div>
);
}