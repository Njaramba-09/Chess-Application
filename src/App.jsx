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

export default function App() {
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("");
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState({ white: 0, black: 0 });
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);

  useEffect(() => {
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/board");
      const data = await res.json();
      setBoard(parseFEN(data.fen));
      setTurn(data.turn);
      setMaterial(data.material);
      setCapturedWhite(data.captured_white || []);
      setCapturedBlack(data.captured_black || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching board:", err);
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
          body: JSON.stringify({ move: from + to })
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

  if (loading) return <p>Loading chessboard...</p>;

  return (
    <div className="app-root">
      <h1>BREE'S CHESS</h1>

      <h2>
        Turn:{" "}
        <span style={{ color: turn === "white" ? "#f0d9b5" : "#333" }}>
          {turn.charAt(0).toUpperCase() + turn.slice(1)}
        </span>
      </h2>

      <h3>
        Material — White: {material.white}, Black: {material.black}
      </h3>

      <div className="captured-section">
        <div>
          <h4>White Captured:</h4>
          <div className="captured-row">
            {capturedWhite.map((p, i) => (
              <img key={i} src={pieceImage(p)} alt={p} className="captured-piece" />
            ))}
          </div>
        </div>
        <div>
          <h4>Black Captured:</h4>
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

      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="rank">
            {row.map((piece, c) => {
              const isLight = (r + c) % 2 === 0;
              const isSelected =
                selected && selected[0] === r && selected[1] === c;
              return (
                <div
                  key={c}
                  className={`square ${isLight ? "light" : "dark"} ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleSquareClick(r, c)}
                >
                  {piece && (
                    <img
                      src={pieceImage(piece)}
                      alt={piece}
                      className="piece-img"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
