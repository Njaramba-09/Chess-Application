from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import chess
from models import db, Game

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///chess.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()

board = chess.Board()
player_white = None
player_black = None

PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 0
}

def material_score(board):
    white = 0
    black = 0
    for piece in board.piece_map().values():
        val = PIECE_VALUES[piece.piece_type]
        if piece.color == chess.WHITE:
            white += val
        else:
            black += val
    return {"white": white, "black": black, "balance": white - black}

def fen_to_array(fen):
    board_arr = []
    for row in fen.split()[0].split("/"):
        rank = []
        for ch in row:
            if ch.isdigit():
                rank.extend([""] * int(ch))
            else:
                rank.append(ch)
        board_arr.append(rank)
    return board_arr

@app.route("/start", methods=["POST"])
def start_game():
    global board, player_white, player_black
    data = request.get_json()
    player_white = data.get("player_white")
    player_black = data.get("player_black")
    board = chess.Board()
    return jsonify({
        "success": True,
        "player_white": player_white,
        "player_black": player_black,
        "fen": board.fen(),
        "board": fen_to_array(board.fen()),
        "turn": "white"
    })

@app.route("/board", methods=["GET"])
def get_board():
    return jsonify({
        "fen": board.fen(),
        "board": fen_to_array(board.fen()),
        "turn": "white" if board.turn == chess.WHITE else "black",
        "is_game_over": board.is_game_over(),
        "is_check": board.is_check(),
        "is_checkmate": board.is_checkmate(),
        "is_stalemate": board.is_stalemate(),
        "material": material_score(board)
    })

@app.route("/move", methods=["POST"])
def make_move():
    global board
    data = request.get_json()
    move_uci = data.get("move")

    try:
        move = chess.Move.from_uci(move_uci)
        if move not in board.legal_moves:
            return jsonify({"success": False, "error": "Illegal move"}), 400

        captured_piece = ""
        if board.is_capture(move):
            captured = board.piece_at(move.to_square)
            captured_piece = captured.symbol() if captured else ""

        board.push(move)

        if board.is_game_over():
            result = "1-0" if board.result() == "1-0" else "0-1" if board.result() == "0-1" else "1/2-1/2"
            new_game = Game(
                fen=board.fen(),
                result=result,
                is_checkmate=board.is_checkmate(),
                is_stalemate=board.is_stalemate(),
                player_white=player_white,
                player_black=player_black,
                moves_count=len(board.move_stack)
            )
            db.session.add(new_game)
            db.session.commit()

        return jsonify({
            "success": True,
            "fen": board.fen(),
            "board": fen_to_array(board.fen()),
            "turn": "white" if board.turn == chess.WHITE else "black",
            "is_game_over": board.is_game_over(),
            "is_check": board.is_check(),
            "is_checkmate": board.is_checkmate(),
            "is_stalemate": board.is_stalemate(),
            "captured_piece": captured_piece,
            "material": material_score(board)
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/history", methods=["GET"])
def get_history():
    games = Game.query.order_by(Game.created_at.desc()).all()
    data = []
    for g in games:
        data.append({
            "id": g.id,
            "fen": g.fen,
            "result": g.result,
            "is_checkmate": g.is_checkmate,
            "is_stalemate": g.is_stalemate,
            "player_white": g.player_white,
            "player_black": g.player_black,
            "moves_count": g.moves_count,
            "created_at": g.created_at.isoformat()
        })
    return jsonify(data)

@app.route("/reset", methods=["POST"])
def reset_board():
    global board
    board = chess.Board()
    return jsonify({
        "success": True,
        "fen": board.fen(),
        "board": fen_to_array(board.fen()),
        "turn": "white",
        "material": material_score(board)
    })

if __name__ == "__main__":
    app.run(debug=True)