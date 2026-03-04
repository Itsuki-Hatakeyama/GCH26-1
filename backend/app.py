import sqlite3
import os # 追加
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# このファイル(app.py)があるフォルダのパスを取得
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'hackathon.db')

# データベースに接続するための便利関数
def get_db_connection():
    # 修正：'hackathon.db' ではなく DB_PATH を使う
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ① ポモドーロ完了通知API（DB更新）
@app.route('/api/pomodoro/finish', methods=['POST'])
def finish_pomodoro():
    data = request.get_json()
    user_id = data.get('user_id', 'user_123')
    study_minutes = data.get('study_minutes', 25)

    conn = get_db_connection()
    c = conn.cursor()

    # ユーザーが存在しない場合は作成し、存在する場合は勉強時間とボム(1個)を追加する
    c.execute('''
        INSERT INTO users (id, study_minutes, bomb_count)
        VALUES (?, ?, 1)
        ON CONFLICT(id) DO UPDATE SET
            study_minutes = study_minutes + ?,
            bomb_count = bomb_count + 1
    ''', (user_id, study_minutes, study_minutes))
    
    conn.commit()

    # 更新後の最新のボムの数を取得してフロントに返す
    c.execute('SELECT bomb_count FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()

    return jsonify({
        "status": "success",
        "reward": {
            "item_type": "bomb",
            "amount_given": 1,
            "total_bombs_owned": user['bomb_count']
        }
    })

# ② ゲーム開始前のアイテム確認API（DB参照）
@app.route('/api/user/inventory', methods=['GET'])
def get_inventory():
    user_id = request.args.get('user_id', 'user_123')
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT bomb_count FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()

    # DBにユーザーがいない場合はボム0個として返す
    bomb_count = user['bomb_count'] if user else 0

    return jsonify({
        "user_id": user_id,
        "items": {
            "bomb": bomb_count
        }
    })

# ③ ゲーム終了時のスコア送信API（DB追加）
@app.route('/api/game/score', methods=['POST'])
def submit_score():
    data = request.get_json()
    user_id = data.get('user_id', 'user_123')
    score = data.get('score', 0)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # スコアを保存
    c.execute('INSERT INTO scores (user_id, score) VALUES (?, ?)', (user_id, score))
    conn.commit()

    # このユーザーの最高スコアを取得してみる（ハイスコア判定用）
    c.execute('SELECT MAX(score) as max_score FROM scores WHERE user_id = ?', (user_id,))
    max_record = c.fetchone()
    conn.close()

    is_high_score = (max_record['max_score'] == score)

    return jsonify({
        "status": "success",
        "saved_score": score,
        "is_high_score": is_high_score
    })

if __name__ == '__main__':
    # サーバーをポート5000で起動
    app.run(debug=True, port=5000)