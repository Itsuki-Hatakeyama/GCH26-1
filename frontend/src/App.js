import React, { useState } from 'react';
import './App.css';

// 4つの画面部品（コンポーネント）を読み込む
import Home from './components/Home';
import Timer from './components/Timer';
import Ranking from './components/Ranking';
import PuzzleBoard from './components/PuzzleBoard';

function App() {
  // 現在表示している画面の状態
  const [view, setView] = useState('home');

  // ① ホーム画面（onNavigateでsetView関数を渡す）
  if (view === 'home') {
    return <Home onNavigate={setView} />;
  }

  // ② タイマー画面
  if (view === 'timer') {
    return <Timer onBack={() => setView('home')} />;
  }

  // ③ ランキング画面
  if (view === 'ranking') {
    return <Ranking onBack={() => setView('home')} />;
  }

  // ④ ゲーム画面
  if (view === 'game') {
    return <PuzzleBoard onBack={() => setView('home')} />;
  }

  return null;
}

export default App;