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

    # friends テーブルの作成（申請・承認ステータス付き）
    c.execute('''
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,      -- 申請を送った人
            friend_id TEXT,    -- 申請を受け取る人
            status TEXT DEFAULT 'pending', -- 'pending'(申請中) または 'accepted'(承認済み)
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, friend_id)
        )
    ''')

    # study_logs テーブルの作成（新規追加：タスク②用）
    c.execute('''
        CREATE TABLE IF NOT EXISTS study_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            subject_name TEXT, -- 教材名や科目名（例：「基本情報技術者」「数学」など）
            study_minutes INTEGER,
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