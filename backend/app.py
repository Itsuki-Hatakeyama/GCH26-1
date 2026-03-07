import sqlite3
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash # 追加：パスワードの暗号化と照合用

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'hackathon.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 新規追加：認証機能 (Auth)
# ==========================================

# 🌟 新規登録API
@app.route('/api/auth/register', methods=['POST'])
def register_user():
    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')

    if not user_id or not password:
        return jsonify({"status": "error", "message": "user_idとpasswordは必須です"}), 400

    # パスワードをそのまま保存するのは危険なので、暗号化（ハッシュ化）する
    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    c = conn.cursor()

    try:
        # DBに保存
        c.execute('INSERT INTO users (id, password) VALUES (?, ?)', (user_id, hashed_password))
        conn.commit()
        return jsonify({"status": "success", "message": "登録が完了しました！"}), 201
    except sqlite3.IntegrityError:
        # すでに同じuser_idが存在する場合
        return jsonify({"status": "error", "message": "そのユーザーIDは既に使われています"}), 409
    finally:
        conn.close()

# 🌟 ログインAPI（登録を作ったなら絶対に必要になります）
@app.route('/api/auth/login', methods=['POST'])
def login_user():
    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()

    # ユーザーが存在し、かつパスワードが一致するか確認
    if user and check_password_hash(user['password'], password):
        return jsonify({"status": "success", "message": "ログイン成功", "user_id": user['id']})
    else:
        return jsonify({"status": "error", "message": "IDまたはパスワードが間違っています"}), 401

# ==========================================
# 既存のゲーム用API
# ==========================================

# ① ポモドーロ完了通知API（DB更新）
@app.route('/api/pomodoro/finish', methods=['POST'])
def finish_pomodoro():
    data = request.get_json()
    user_id = data.get('user_id')
    study_minutes = data.get('study_minutes', 25)

    if not user_id:
        return jsonify({"status": "error", "message": "user_idは必須です"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    # 先にユーザーが存在するか確認する
    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()

    if not user:
        conn.close()
        return jsonify({"status": "error", "message": "ユーザーが見つかりません。先に新規登録してください。"}), 404

    # ユーザーが存在する場合のみ、勉強時間とボムを追加する（UPDATEのみ）
    c.execute('''
        UPDATE users 
        SET study_minutes = study_minutes + ?, bomb_count = bomb_count + ?
        WHERE id = ?
    ''', (study_minutes, 1, user_id))
    conn.commit()

    # 最新のボムの数を取得してフロントに返す
    c.execute('SELECT bomb_count FROM users WHERE id = ?', (user_id,))
    updated_user = c.fetchone()
    conn.close()

    return jsonify({
        "status": "success",
        "reward": {
            "item_type": "bomb",
            "amount_given": 1,
            "total_bombs_owned": updated_user['bomb_count']
        }
    })

# ② ゲーム開始前のアイテム確認API（変更なし）
@app.route('/api/user/inventory', methods=['GET'])
def get_inventory():
    user_id = request.args.get('user_id', 'user_123')
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT bomb_count FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()

    bomb_count = user['bomb_count'] if user else 0

    return jsonify({
        "user_id": user_id,
        "items": {
            "bomb": bomb_count
        }
    })

# ③ ゲーム終了時のスコア送信API（変更なし）
@app.route('/api/game/score', methods=['POST'])
def submit_score():
    data = request.get_json()
    user_id = data.get('user_id', 'user_123')
    score = data.get('score', 0)
    
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute('INSERT INTO scores (user_id, score) VALUES (?, ?)', (user_id, score))
    conn.commit()

    c.execute('SELECT MAX(score) as max_score FROM scores WHERE user_id = ?', (user_id,))
    max_record = c.fetchone()
    conn.close()

    is_high_score = (max_record['max_score'] == score)

    return jsonify({
        "status": "success",
        "saved_score": score,
        "is_high_score": is_high_score
    })

# ④ ランキング取得API（変更なし）
@app.route('/api/game/ranking', methods=['GET'])
def get_ranking():
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute('''
        SELECT user_id, score, created_at 
        FROM scores 
        ORDER BY score DESC 
        LIMIT 10
    ''')
    ranking_data = c.fetchall()
    conn.close()

    ranking_list = []
    for rank, row in enumerate(ranking_data, start=1):
        ranking_list.append({
            "rank": rank,
            "user_id": row["user_id"],
            "score": row["score"],
            "date": row["created_at"]
        })

    return jsonify({
        "status": "success",
        "ranking": ranking_list
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)