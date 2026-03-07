import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  
  // ★追加：今が「ログイン画面」か「新規登録画面」かを切り替えるスイッチ
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (userId.trim() !== '') {
      
      // ---------------------------------------------------------
      // 💡 後でバックエンド（API）と繋ぐ時はここに処理を書きます！
      // ---------------------------------------------------------
      if (isLoginMode) {
        // 【ログインの処理】
        // 例: データベースを見て、この userId が存在するかチェックする
        console.log('ログイン実行:', userId);
      } else {
        // 【新規登録の処理】
        // 例: データベースの users テーブルに新しい userId を登録する
        // （study_minutes: 0, bomb_count: 0 で初期データを作る）
        console.log('新規登録実行:', userId);
      }
      
      // ※今はUI（見た目）を作っている段階なので、
      // どちらのモードでもApp.jsにIDを渡して先に進めちゃいます！
      onLogin(userId);

    } else {
      alert('ユーザーIDを入力してください！');
    }
  };

return (
    <div className="container theme-home" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* このコンテナの maxWidth: '400px' の中でテキストが折り返されています */}
      <div className="home-content" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '40px', borderRadius: '20px' }}>
        
        <h1 className="app-title" style={{ fontSize: '28px', marginBottom: '10px' }}>PUZZLE & DRYOKU's</h1>
        
        {/* ★ここを修正！ whiteSpace: 'nowrap' を追加します */}
        <p className="app-subtitle" style={{ marginBottom: '30px', whiteSpace: 'nowrap' }}>
          {isLoginMode ? 'ログインして努力を記録しよう' : '新しくアカウントを作成しよう'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            {/* モードによってラベルが変わる */}
            <label style={{ display: 'block', color: '#c4b5fd', marginBottom: '5px', textAlign: 'left', fontSize: '14px' }}>
              {isLoginMode ? 'ユーザーID' : '希望するユーザーID'}
            </label>
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="例: user_123"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #8b5cf6',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* モードによってボタンの色と文字が変わる！ */}
          <button 
            type="submit" 
            className="btn-main" 
            style={{ 
              marginTop: '15px', 
              width: '100%', 
              backgroundColor: isLoginMode ? '#8b5cf6' : '#2ed573' // 登録時は緑色に！
            }}
          >
            {isLoginMode ? 'LOGIN' : 'SIGN UP'}
          </button>
        </form>

        {/* ★追加：ログインと新規登録を切り替えるボタン */}
        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c4b5fd',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isLoginMode ? '初めての方はこちら（新規登録）' : 'すでにアカウントをお持ちの方（ログイン）'}
          </button>
        </div>
        
      </div>
    </div>
  );
}