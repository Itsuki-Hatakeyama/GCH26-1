import sqlite3
import os # 追加

# このファイル(init_db.py)があるフォルダのパスを取得し、そこにDBを作る設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'hackathon.db')

def init_db():
    # 修正：'hackathon.db' ではなく DB_PATH を使う
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # users テーブルの作成
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
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

    # 開発テスト用に、初期ユーザーを1人登録しておく
    c.execute('INSERT OR IGNORE INTO users (id, study_minutes, bomb_count) VALUES ("user_123", 0, 0)')

    # 変更を保存して閉じる
    conn.commit()
    conn.close()
    print(f"データベースの初期化が完了しました！\n保存場所: {DB_PATH}")

if __name__ == '__main__':
    init_db()