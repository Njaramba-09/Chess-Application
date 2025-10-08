from flask import Flask, jsonify, request
from flask_cors import CORS
import chess

app = Flask(__name__)
CORS(app)


board = chess.Board()


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
