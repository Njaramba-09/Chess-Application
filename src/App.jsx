import { useState } from "react";

const initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

function pieceImage(piece) {
  if (!piece) return "";
  const color = piece === piece.toUpperCase() ? "w" : "b";
  const type = piece.toLowerCase();
  return `/pieces/${color}${type}.svg`;
}

export default function App() {
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("white"); // track whose turn it is

  const handleSquareClick = (r, c) => {
    if (!selected) {
      const piece = board[r][c];
      if (piece === "") return;

      // Determine piece color
      const pieceColor = piece === piece.toUpperCase() ? "white" : "black";
      if (pieceColor !== turn) return; // not your turn!

      setSelected([r, c]);
    } else {
      const [sr, sc] = selected;
      const piece = board[sr][sc];
      const newBoard = board.map((row) => [...row]);

      // Move the piece
      newBoard[r][c] = piece;
      newBoard[sr][sc] = "";

      setBoard(newBoard);
      setSelected(null);

      // Switch turn
      setTurn(turn === "white" ? "black" : "white");
    }
  };

  const handleReset = () => {
    setBoard(initialBoard.map(row => [...row])); // clone to avoid mutation
    setSelected(null);
    setTurn("white");
  };

  return (
    <div className="app-root">
      <h1>Bree’s Chess</h1>

      {/* Display current turn */}
      <h2>Turn: <span style={{ color: turn === "white" ? "#f0d9b5" : "#333" }}>
        {turn.charAt(0).toUpperCase() + turn.slice(1)}
      </span></h2>

      {/* Reset button */}
      <button onClick={handleReset} className="reset-btn">Reset Board</button>

      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="rank">
            {row.map((piece, c) => {
              const isLight = (r + c) % 2 === 0;
              const isSelected = selected && selected[0] === r && selected[1] === c;
              return (
                <div
                  key={c}
                  className={`square ${isLight ? "light" : "dark"} ${isSelected ? "selected" : ""}`}
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
