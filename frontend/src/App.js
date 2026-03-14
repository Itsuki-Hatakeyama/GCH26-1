import React, { useState } from 'react';
import './App.css';

import Login from './components/Login';
import Home from './components/Home';
import Timer from './components/Timer';
import Ranking from './components/Ranking';
import PuzzleBoard from './components/PuzzleBoard';
import Profile from './components/Profile';
import Friends from './components/Friend'; 
import Missions from './components/Missions';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home');

  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      setCurrentUser(null);
      setView('home'); 
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

  if (view === 'home') {
    return (
      <div>
        <Home 
          onNavigate={setView} 
          currentUser={currentUser}
          onLogout={handleLogout}  
        />
      </div>
    );
  }

  if (view === 'timer') {
    return <Timer onBack={() => setView('home')} currentUser={currentUser} />;
  }

  if (view === 'ranking') {
    return <Ranking onBack={() => setView('home')} currentUser={currentUser} />;
  }

  // ④ ゲーム画面（🌟 ここを userId={currentUser.id} に修正しました！）
  if (view === 'game') {
    return <PuzzleBoard onBack={() => setView('home')} userId={currentUser.id} />;
  }

  if (view === 'profile') {
    return <Profile onBack={() => setView('home')} currentUser={currentUser} />;
  } 

  // ★ 追加：⑥ フレンド（ネットワーク）画面
  if (view === 'friends') {
    return <Friends onBack={() => setView('home')} currentUser={currentUser} />;
  }

  if (view === 'missions') {
    return <Missions onBack={() => setView('home')} currentUser={currentUser} />;
  }

  return null;
}

export default App;