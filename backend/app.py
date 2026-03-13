import sqlite3
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# データベースのパス設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'hackathon.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 1. 認証機能 (Auth API)
# ==========================================

# 新規登録
@app.route('/api/auth/register', methods=['POST'])
def register_user():
    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')

    if not user_id or not password:
        return jsonify({"status": "error", "message": "user_idとpasswordは必須です"}), 400

    hashed_password = generate_password_hash(password)
    conn = get_db_connection()
    c = conn.cursor()

    try:
        c.execute('INSERT INTO users (id, password, study_minutes, bomb_count) VALUES (?, ?, 0, 0)', (user_id, hashed_password))
        conn.commit()
        return jsonify({"status": "success", "message": "登録が完了しました！"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "そのユーザーIDは既に使われています"}), 409
    finally:
        conn.close()

# ログイン
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

    if user and check_password_hash(user['password'], password):
        return jsonify({"status": "success", "message": "ログイン成功", "user_id": user['id']})
    else:
        return jsonify({"status": "error", "message": "IDまたはパスワードが間違っています"}), 401

# ==========================================
# 2. ユーザー＆アイテム機能 (User API)
# ==========================================

# ポモドーロ完了通知（ボムと勉強時間を追加＋教材ごとの記録）
@app.route('/api/pomodoro/finish', methods=['POST'])
def finish_pomodoro():
    data = request.get_json()
    user_id = data.get('user_id')
    study_minutes = data.get('study_minutes', 25)
    # ★追加：フロントから「教材名」も受け取る（無ければ「その他」にする）
    subject_name = data.get('subject_name', 'その他')

    if not user_id:
        return jsonify({"status": "error", "message": "user_idは必須です"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()

    if not user:
        conn.close()
        return jsonify({"status": "error", "message": "ユーザーが見つかりません"}), 404

    # 1. 今まで通り、usersテーブルの累計時間とボムを増やす
    c.execute('''
        UPDATE users 
        SET study_minutes = COALESCE(study_minutes, 0) + ?, 
            bomb_count = COALESCE(bomb_count, 0) + ?
        WHERE id = ?
    ''', (study_minutes, 1, user_id))
    
    # ★追加：2. study_logsテーブルに「何を何分勉強したか」を記録する
    c.execute('''
        INSERT INTO study_logs (user_id, subject_name, study_minutes)
        VALUES (?, ?, ?)
    ''', (user_id, subject_name, study_minutes))

    conn.commit()

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

# アイテム（ボム）所持数の確認
@app.route('/api/user/inventory', methods=['GET'])
def get_inventory():
    user_id = request.args.get('user_id')
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT bomb_count FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()

    bomb_count = user['bomb_count'] if user else 0

    return jsonify({
        "status": "success",
        "user_id": user_id,
        "items": {"bomb": bomb_count}
    })

# プロフィール情報（累計、ボム、ハイスコア、教材別データ）の取得
@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"status": "error", "message": "user_idは必須です"}), 400

    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. ユーザーの基本情報（累計時間とボム）
    c.execute('SELECT study_minutes, bomb_count FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()

    if not user:
        conn.close()
        return jsonify({"status": "error", "message": "ユーザーが見つかりません"}), 404

    # ★タスク①：2. これまでのハイスコアを取得
    c.execute('SELECT MAX(score) as max_score FROM scores WHERE user_id = ?', (user_id,))
    score_record = c.fetchone()
    high_score = score_record['max_score'] if score_record['max_score'] else 0

    # ★タスク②：3. 教材(subject_name)ごとの合計勉強時間を取得（グラフ用）
    c.execute('''
        SELECT subject_name, SUM(study_minutes) as total_minutes
        FROM study_logs
        WHERE user_id = ?
        GROUP BY subject_name
        ORDER BY total_minutes DESC
    ''', (user_id,))
    logs = c.fetchall()
    
    # フロントが扱いやすいようにリスト形式に変換
    study_stats = [{"subject": row["subject_name"], "minutes": row["total_minutes"]} for row in logs]

    conn.close()

    return jsonify({
        "status": "success",
        "user_id": user_id,
        "study_minutes": user['study_minutes'] or 0,
        "bomb_count": user['bomb_count'] or 0,
        "high_score": high_score,         # 追加！
        "study_stats": study_stats        # 追加！
    })

# ==========================================
# 3. ゲーム＆ランキング機能 (Game API)
# ==========================================

# ゲーム終了時のスコア送信
@app.route('/api/game/score', methods=['POST'])
def submit_score():
    data = request.get_json()
    user_id = data.get('user_id')
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

# ⑦ ランキング取得（トップ10：1人1つの最高スコアのみ！）
@app.route('/api/game/ranking', methods=['GET'])
def get_ranking():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 🌟 修正：GROUP BY でユーザーをまとめ、MAX() で最高スコアだけを抽出！
    c.execute('''
        SELECT user_id, MAX(score) as score, created_at 
        FROM scores 
        GROUP BY user_id 
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
            "score": row["score"], # SQL側で "as score" と名付けたので、今まで通りこれで取れます！
            "date": row["created_at"]
        })

    return jsonify({
        "status": "success",
        "ranking": ranking_list
    })

# ==========================================
# 4. フレンド機能 (Friend API)
# ==========================================

# フレンド申請を送る
@app.route('/api/friends/request', methods=['POST'])
def request_friend():
    data = request.get_json()
    user_id = data.get('user_id')       
    friend_id = data.get('friend_id')   

    if not user_id or not friend_id:
        return jsonify({"status": "error", "message": "user_idとfriend_idは必須です"}), 400
    if user_id == friend_id:
        return jsonify({"status": "error", "message": "自分自身には申請できません"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    c.execute('SELECT id FROM users WHERE id = ?', (friend_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({"status": "error", "message": "そのIDのユーザーは存在しません"}), 404

    try:
        c.execute('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, "pending")', (user_id, friend_id))
        conn.commit()
        return jsonify({"status": "success", "message": f"{friend_id}にフレンド申請を送りました！"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "すでに申請済み、またはフレンドです"}), 409
    finally:
        conn.close()

# フレンド申請を承認する
@app.route('/api/friends/accept', methods=['POST'])
def accept_friend():
    data = request.get_json()
    user_id = data.get('user_id')       
    friend_id = data.get('friend_id')   

    conn = get_db_connection()
    c = conn.cursor()

    c.execute('''
        UPDATE friends 
        SET status = 'accepted' 
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    ''', (friend_id, user_id)) 

    if c.rowcount == 0:
        conn.close()
        return jsonify({"status": "error", "message": "承認できる申請が見つかりません"}), 404

    try:
        c.execute('INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, "accepted")', (user_id, friend_id))
        conn.commit()
    except sqlite3.IntegrityError:
        pass
    
    conn.close()
    return jsonify({"status": "success", "message": f"{friend_id}の申請を承認しました！"})

# フレンド一覧と承認待ち一覧の取得
@app.route('/api/friends/list', methods=['GET'])
def get_friends():
    user_id = request.args.get('user_id')
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # 承認済みのフレンド一覧
    c.execute('''
        SELECT f.friend_id, u.study_minutes 
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ? AND f.status = 'accepted'
    ''', (user_id,))
    accepted_friends = [{"friend_id": row["friend_id"], "study_minutes": row["study_minutes"]} for row in c.fetchall()]
    
    # 承認待ちの申請一覧
    c.execute('''
        SELECT f.user_id as requester_id, u.study_minutes 
        FROM friends f
        JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'
    ''', (user_id,))
    pending_requests = [{"requester_id": row["requester_id"], "study_minutes": row["study_minutes"]} for row in c.fetchall()]
    
    conn.close()

    return jsonify({
        "status": "success",
        "user_id": user_id,
        "friends": accepted_friends,
        "pending_requests": pending_requests
    })

# ⑪ ボム消費API (POST)
@app.route('/api/game/use_bomb', methods=['POST'])
def use_bomb():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"status": "error", "message": "user_idは必須です"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    # 現在のボムの数を確認
    c.execute('SELECT bomb_count FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()

    # ボムを持っていない場合はエラーを返す
    if not user or user['bomb_count'] <= 0:
        conn.close()
        return jsonify({"status": "error", "message": "ボムが足りません"}), 400

    # ボムを1つ減らす (NULL対策済み)
    c.execute('''
        UPDATE users 
        SET bomb_count = COALESCE(bomb_count, 0) - 1 
        WHERE id = ?
    ''', (user_id,))
    conn.commit()

    c.execute('SELECT bomb_count FROM users WHERE id = ?', (user_id,))
    updated_user = c.fetchone()
    conn.close()

    return jsonify({
        "status": "success",
        "message": "ボムを1つ消費しました",
        "remaining_bombs": updated_user['bomb_count']
    })

# ==========================================
# 5. ミッション機能 (Missions API)
# ==========================================

# ⑫ デイリーミッション進捗確認API (GET)
@app.route('/api/missions/daily', methods=['GET'])
def get_daily_mission():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "user_idは必須です"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    # ① 今日の合計勉強時間を計算 (SQLiteの機能で今日の日付を判定)
    c.execute('''
        SELECT SUM(study_minutes) as today_minutes 
        FROM study_logs 
        WHERE user_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')
    ''', (user_id,))
    row = c.fetchone()
    today_minutes = row['today_minutes'] if row['today_minutes'] else 0

    # ② 今日すでに報酬を受け取っているか確認
    c.execute('''
        SELECT * FROM daily_rewards 
        WHERE user_id = ? AND reward_date = date('now', 'localtime')
    ''', (user_id,))
    is_claimed = c.fetchone() is not None

    conn.close()

    target_minutes = 100  # ★デイリーミッションの目標時間（ここは自由に変更OK！）

    return jsonify({
        "status": "success",
        "today_minutes": today_minutes,
        "target_minutes": target_minutes,
        "is_cleared": today_minutes >= target_minutes, # 目標達成しているか(True/False)
        "is_claimed": is_claimed                       # 受け取り済みか(True/False)
    })

# ⑬ デイリーミッション報酬受け取りAPI (POST)
@app.route('/api/missions/claim', methods=['POST'])
def claim_daily_reward():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"status": "error", "message": "user_idは必須です"}), 400

    conn = get_db_connection()
    c = conn.cursor()

    # ① 今日の勉強時間を再確認（不正アクセス防止）
    c.execute('''
        SELECT SUM(study_minutes) as today_minutes 
        FROM study_logs 
        WHERE user_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')
    ''', (user_id,))
    row = c.fetchone()
    today_minutes = row['today_minutes'] if row['today_minutes'] else 0

    target_minutes = 100  # デイリーミッションの目標時間（ここは先ほどと同じ値にすること！）

    if today_minutes < target_minutes:
        conn.close()
        return jsonify({"status": "error", "message": "まだミッションをクリアしていません"}), 400

    try:
        # ② 報酬履歴に「今日受け取ったよ」と記録する
        c.execute('''
            INSERT INTO daily_rewards (user_id, reward_date) 
            VALUES (?, date('now', 'localtime'))
        ''', (user_id,))
        
        # ③ ボムを1個増やす！
        c.execute('''
            UPDATE users 
            SET bomb_count = COALESCE(bomb_count, 0) + 1 
            WHERE id = ?
        ''', (user_id,))
        
        conn.commit()
        return jsonify({"status": "success", "message": "デイリーミッション達成！ボムを獲得しました！"}), 200
    except sqlite3.IntegrityError:
        # すでに今日の記録がある場合（2回押された場合など）
        return jsonify({"status": "error", "message": "今日の報酬はすでに受け取り済みです"}), 409
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)