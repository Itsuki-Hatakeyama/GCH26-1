import React, { useState } from 'react';
import './App.css';

import Login from './components/Login';
import Home from './components/Home';
import Timer from './components/Timer';
import Ranking from './components/Ranking';
import PuzzleBoard from './components/PuzzleBoard';
import Profile from './components/Profile';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home');

  // ★追加：ログアウト処理
  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      setCurrentUser(null);
      setView('home'); // 次回ログイン時にホームから始まるようにリセット
    }
  };

  if (!currentUser) {
    return (
      <Login 
        onLogin={(userId) => {
          setCurrentUser({ id: userId });
          setView('home');
        }} 
      />
    );
  }

  // ① ホーム画面
  if (view === 'home') {
    return (
      <div>
        {/* ★ここにあったID表示の代わりに、Homeの中でログアウトボタンと一緒に表示させるのが綺麗です */}
        <Home 
          onNavigate={setView} 
          currentUser={currentUser} // ID表示用に渡す
          onLogout={handleLogout}    // ★ログアウト関数を渡す
        />
      </div>
    );
  }

  // ② タイマー画面
  if (view === 'timer') {
    return <Timer onBack={() => setView('home')} currentUser={currentUser} />;
  }

  // ③ ランキング画面
  if (view === 'ranking') {
    return <Ranking onBack={() => setView('home')} currentUser={currentUser} />;
  }

  // ④ ゲーム画面（🌟 ここを userId={currentUser.id} に修正しました！）
  if (view === 'game') {
    return <PuzzleBoard onBack={() => setView('home')} userId={currentUser.id} />;
  }

  // ⑤ プロフィール画面を追加
  if (view === 'profile') {
    return <Profile onBack={() => setView('home')} currentUser={currentUser} />;
  } 

  return null;
}

export default App;