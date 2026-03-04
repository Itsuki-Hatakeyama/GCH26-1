import React from 'react';
import { motion } from 'framer-motion'; // 動きのライブラリ
import confetti from 'canvas-confetti';  // 紙吹雪のライブラリ

function App() {
  // 紙吹雪を飛ばす関数
  const playConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffeb3b', '#e91e63', '#00bcd4']
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#1a1a1a', // 背景を少し暗くしてエフェクトを目立たせる
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ marginBottom: '40px' }}>VFX 実験室 🧪</h1>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '50px' }}>
        {/* 演出1: ぷるぷる揺れるボタン */}
        <div style={{ textAlign: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ x: [-5, 5, -5, 5, 0] }}
            style={{ 
              padding: '15px 30px', 
              fontSize: '18px', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              border: 'none', 
              background: '#e91e63', 
              color: 'white',
              boxShadow: '0 4px 15px rgba(233, 30, 99, 0.4)'
            }}
          >
            ダメージ！
          </motion.button>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>クリックで振動テスト</p>
        </div>

        {/* 演出2: 紙吹雪 */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={playConfetti}
            style={{ 
              padding: '15px 30px', 
              fontSize: '18px', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              border: 'none', 
              background: '#ffeb3b', 
              color: '#333',
              boxShadow: '0 4px 15px rgba(255, 235, 59, 0.4)'
            }}
          >
            ポモドーロ完了！
          </button>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>クリックで紙吹雪テスト</p>
        </div>
      </div>

      {/* 演出3: ブロックが消えるアニメーション */}
      <div style={{ textAlign: 'center', border: '1px solid #444', padding: '20px', borderRadius: '15px' }}>
        <p style={{ marginBottom: '20px' }}>ブロック消滅のイメージ</p>
        <motion.div
          animate={{ 
            scale: [1, 1.4, 0], 
            rotate: [0, 45, 90],
            opacity: [1, 1, 0] 
          }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            repeatDelay: 1 
          }}
          style={{ 
            width: '60px', 
            height: '60px', 
            backgroundColor: '#00bcd4', 
            borderRadius: '8px',
            margin: '0 auto',
            boxShadow: '0 0 20px rgba(0, 188, 212, 0.6)'
          }}
        />
      </div>
    </div>
  );
}

export default App;