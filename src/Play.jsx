import { useState, useEffect } from "react";

function pieceImage(piece) {
  if (!piece) return "";
  const color = piece === piece.toUpperCase() ? "w" : "b";
  const type = piece.toLowerCase();
  return `/pieces/${color}${type}.svg`;
}

function parseFEN(fen) {
  const rows = fen.split(" ")[0].split("/");
  return rows.map((row) =>
    row
      .split("")
      .map((ch) => (isNaN(ch) ? ch : Array(parseInt(ch)).fill("")))
      .flat()
  );
}

function coordFromIndices(r, c) {
  return String.fromCharCode(97 + c) + (8 - r);
}

export default function Play() {
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("");
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState({ white: 0, black: 0 });
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [playerWhite, setPlayerWhite] = useState("");
  const [playerBlack, setPlayerBlack] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = async () => {
    if (!playerWhite || !playerBlack) {
      alert("Please enter both player names");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:5000/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_white: playerWhite, player_black: playerBlack }),
      });
      const data = await res.json();
      setBoard(parseFEN(data.fen));
      setTurn(data.turn);
      setMaterial({ white: 0, black: 0 });
      setCapturedWhite([]);
      setCapturedBlack([]);
      setGameStarted(true);
      setLoading(false);
    } catch (err) {
      console.error("Error starting game:", err);
    }
  };

  const handleSquareClick = async (r, c) => {
    if (!selected) {
      const piece = board[r][c];
      if (!piece) return;
      const pieceColor = piece === piece.toUpperCase() ? "white" : "black";
      if (pieceColor !== turn) return;
      setSelected([r, c]);
    } else {
      const [sr, sc] = selected;
      const from = coordFromIndices(sr, sc);
      const to = coordFromIndices(r, c);
      try {
        const res = await fetch("http://127.0.0.1:5000/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ move: from + to }),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || "Illegal move!");
          setSelected(null);
          return;
        }

        setBoard(parseFEN(data.fen));
        setTurn(data.turn);
        setMaterial(data.material);
        if (data.captured_piece) {
          const cap = data.captured_piece;
          if (cap === cap.toUpperCase()) {
            setCapturedWhite((prev) => [...prev, cap]);
          } else {
            setCapturedBlack((prev) => [...prev, cap]);
          }
        }
        setSelected(null);

        if (data.is_checkmate) alert(`${turn} wins by checkmate!`);
        else if (data.is_stalemate) alert("Stalemate!");
      } catch (err) {
        console.error("Error making move:", err);
        setSelected(null);
      }
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/reset", { method: "POST" });
      const data = await res.json();
      setBoard(parseFEN(data.fen));
      setTurn(data.turn);
      setMaterial(data.material);
      setSelected(null);
      setCapturedWhite([]);
      setCapturedBlack([]);
    } catch (err) {
      console.error("Error resetting board:", err);
    }
  };

  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1 className="title">BREE'S CHESS</h1>
        <div className="player-inputs">
          <div className="input-group">
            <label>White Player:</label>
            <input
              type="text"
              value={playerWhite}
              onChange={(e) => setPlayerWhite(e.target.value)}
              placeholder="Enter White player's name"
              className="input-field"
            />
          </div>
          <div className="input-group">
            <label>Black Player:</label>
            <input
              type="text"
              value={playerBlack}
              onChange={(e) => setPlayerBlack(e.target.value)}
              placeholder="Enter Black player's name"
              className="input-field"
            />
          </div>
        </div>
        <button onClick={startGame} className="start-btn">
          Start Game
        </button>
      </div>
    );
  }

  if (loading) return <p className="loading">Loading chessboard...</p>;

  return (
    <div className="app-root">
      <h1 className="title">BREE'S CHESS</h1>
      <h2 className="subtitle">
        {playerWhite} (White) vs {playerBlack} (Black)
      </h2>
      <h3 className="turn-indicator">
        Turn:{" "}
        <span className={`turn-color ${turn}`}>
          {turn.charAt(0).toUpperCase() + turn.slice(1)}
        </span>
      </h3>
      <h4 className="material-count">
        Material — White: {material.white}, Black: {material.black}
      </h4>

      <div className="captured-section">
        <div className="captured-container">
          <h4 className="captured-title">White Captured:</h4>
          <div className="captured-row">
            {capturedWhite.map((p, i) => (
              <img key={i} src={pieceImage(p)} alt={p} className="captured-piece" />
            ))}
          </div>
        </div>
        <div className="captured-container">
          <h4 className="captured-title">Black Captured:</h4>
          <div className="captured-row">
            {capturedBlack.map((p, i) => (
              <img key={i} src={pieceImage(p)} alt={p} className="captured-piece" />
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleReset} className="reset-btn">
        Reset Board
      </button>

      <div className="board-container">
        <div className="board">
          {board.map((row, r) => (
            <div key={r} className="rank">
              {row.map((piece, c) => {
                const isLight = (r + c) % 2 === 0;
                const isSelected = selected && selected[0] === r && selected[1] === c;
                return (
                  <div
                    key={c}
                    className={`square ${isLight ? "light" : "dark"} ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleSquareClick(r, c)}
                  >
                    {piece && (
                      <img src={pieceImage(piece)} alt={piece} className="piece-img" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}