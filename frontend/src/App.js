import React, { useState } from 'react';
import './App.css';

import Login from './components/Login'; // ★追加
import Home from './components/Home';
import Timer from './components/Timer';
import Ranking from './components/Ranking';
import PuzzleBoard from './components/PuzzleBoard';

function App() {
  // ★追加：ログインしているユーザーの情報を保存する場所（最初は誰もログインしていないので null）
  const [currentUser, setCurrentUser] = useState(null);
  
  // 画面遷移用の状態（最初はホーム画面）
  const [view, setView] = useState('home');

  // ★追加：まだログインしていなければ、強制的にLogin画面を表示！
  if (!currentUser) {
    return (
      <Login 
        onLogin={(userId) => {
          // ログインボタンが押されたら、ここでユーザーIDを保存する
          setCurrentUser({ id: userId });
          setView('home'); // ホーム画面に移動
        }} 
      />
    );
  }

  // --------------------------------------------------------
  // ここから下は、ログイン済みの人だけが見れる画面です！
  // --------------------------------------------------------

  // ① ホーム画面
  if (view === 'home') {
    return (
      <div>
        {/* テスト用に、画面右上にログイン中のIDを表示してみましょう */}
        <div style={{ position: 'absolute', top: 10, right: 10, color: '#c4b5fd', fontSize: '14px' }}>
          ID: {currentUser.id}
        </div>
        <Home onNavigate={setView} />
      </div>
    );
  }

  // ② タイマー画面（後で currentUser.id を使ってボムを増やすAPIを叩けます）
  if (view === 'timer') {
    return <Timer onBack={() => setView('home')} />;
  }

  // ③ ランキング画面
  if (view === 'ranking') {
    return <Ranking onBack={() => setView('home')} />;
  }

  // ④ ゲーム画面（後で currentUser.id を使ってボムの所持数を取得したり、スコアを保存したりします）
  if (view === 'game') {
    return <PuzzleBoard onBack={() => setView('home')} />;
  }

  return null;
}

export default App;