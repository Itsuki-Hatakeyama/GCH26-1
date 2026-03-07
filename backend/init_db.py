import sqlite3
import os
from werkzeug.security import generate_password_hash # 追加：パスワード暗号化ツール

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'hackathon.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 開発用：既存の古いusersテーブルがあれば一度削除して作り直す
    c.execute('DROP TABLE IF EXISTS users')

    # users テーブルの作成（password列を追加！）
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            study_minutes INTEGER DEFAULT 0,
            bomb_count INTEGER DEFAULT 0
        )
    ''')

    # scores テーブルの作成
    c.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 開発テスト用に、初期ユーザーを1人登録しておく（パスワードはハッシュ化して保存）
    test_password = generate_password_hash("password123")
    c.execute('INSERT OR IGNORE INTO users (id, password, study_minutes, bomb_count) VALUES (?, ?, 0, 0)', ("user_123", test_password))

    conn.commit()
    conn.close()
    print(f"データベースの初期化が完了しました！\n保存場所: {DB_PATH}")

if __name__ == '__main__':
    init_db()