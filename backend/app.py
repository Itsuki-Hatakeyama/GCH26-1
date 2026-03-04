from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# フロントエンド(例: localhost:3000)からの通信を許可する設定
CORS(app)

# ① ポモドーロ完了通知API
@app.route('/api/pomodoro/finish', methods=['POST'])
def finish_pomodoro():
    # フロントエンドから送られてきたデータを受け取る
    data = request.get_json()
    print(f"受信データ: {data}")
    
    # ※後でここに「データベースに保存する処理」を書きます
    
    # 今はダミーデータを返す
    return jsonify({
        "status": "success",
        "reward": {
            "item_type": "bomb",
            "amount_given": 1,
            "total_bombs_owned": 3
        }
    })

# ② ゲーム開始前のアイテム確認API
@app.route('/api/user/inventory', methods=['GET'])
def get_inventory():
    user_id = request.args.get('user_id')
    
    # ※後でここに「データベースからアイテム数を取得する処理」を書きます
    
    return jsonify({
        "user_id": user_id or "guest",
        "items": {
            "bomb": 3,
            "rocket": 1
        }
    })

# ③ ゲーム終了時のスコア送信API
@app.route('/api/game/score', methods=['POST'])
def submit_score():
    data = request.get_json()
    print(f"受信スコア: {data}")
    
    # ※後でここに「スコアをDBに保存し、ランキングを計算する処理」を書きます
    
    return jsonify({
        "status": "success",
        "is_high_score": True,
        "current_rank": 4
    })

if __name__ == '__main__':
    # サーバーをポート5000で起動
    app.run(debug=True, port=5000)