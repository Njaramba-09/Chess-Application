from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fen = db.Column(db.String(255), nullable=False)
    result = db.Column(db.String(10), nullable=False)
    is_checkmate = db.Column(db.Boolean, default=False)
    is_stalemate = db.Column(db.Boolean, default=False)
    player_white = db.Column(db.String(100))
    player_black = db.Column(db.String(100))
    moves_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())