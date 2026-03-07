import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userId.trim() !== '' && password.trim() !== '') {
      onLogin(userId);
    } else {
      alert('IDとパスワードを入力してください！');
    }
  };

  // 指定のアクセントカラー：空色（#38bdf8）
  const accentColor = '#38bdf8';

  return (
    <div className="container theme-home" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      {/* --- タイトル部分 --- */}
      <h1 className="app-title">
        PUZZLE<br />&<br />DRYOKU's
      </h1>
      
      <p style={{ 
        color: accentColor, 
        marginBottom: '40px', 
        fontSize: '18px',
        letterSpacing: '0.3em',
        fontWeight: 'bold'
      }}>
        {isLoginMode ? '>> ログイン' : '>> 新規登録'}
      </p>

      {/* --- 入力カード部分 --- */}
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: 'rgba(30, 41, 59, 0.4)', // 指定の背景色を少し透過
        backdropFilter: 'blur(8px)',
        padding: '50px 40px',
        borderRadius: '4px', // あえて角を丸めすぎず、メカニカルな印象に
        border: `1px solid ${accentColor}44`,
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5)`,
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: accentColor, fontSize: '14px', fontFamily: 'monospace', marginBottom: '8px', display: 'block' }}>
              _USER_ID:
            </label>
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ENTER ID"
              className="login-input"
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ color: accentColor, fontSize: '14px', fontFamily: 'monospace', marginBottom: '8px', display: 'block' }}>
              _PASSWORD:
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="login-input"
            />
          </div>

          <button 
            type="submit" 
            style={{
              marginTop: '20px',
              padding: '18px',
              backgroundColor: 'transparent',
              color: accentColor,
              border: `2px solid ${accentColor}`,
              fontSize: '20px',
              fontWeight: '900',
              cursor: 'pointer',
              letterSpacing: '0.2em',
              transition: 'all 0.3s',
              fontFamily: 'monospace'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = accentColor;
              e.target.style.color = '#020617';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = accentColor;
            }}
          >
            {isLoginMode ? '[ LOGIN ]' : '[ SIGN UP ]'}
          </button>
        </form>

        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          >
            {isLoginMode ? "// 新規アカウント作成" : "// 既存アカウントでログイン"}
          </button>
        </div>
      </div>

      {/* スタイル調整 */}
      <style>{`
        .login-input {
          width: 100%;
          padding: 15px;
          border-radius: 0px; /* 直線的なデザイン */
          border: 1px solid rgba(56, 189, 248, 0.2);
          background-color: rgba(15, 23, 42, 0.8);
          color: white;
          font-size: 18px;
          font-family: 'Courier New', monospace;
          outline: none;
          box-sizing: border-box;
          transition: all 0.3s;
        }
        .login-input:focus {
          border-color: ${accentColor};
          box-shadow: 0 0 10px ${accentColor}44;
        }
      `}</style>
    </div>
  );
}