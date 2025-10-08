import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function History() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/history");
        const data = await res.json();
        setGames(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading)
    return (
      <div className="history-page">
        <p className="loading-text">Loading history...</p>
      </div>
    );

  if (games.length === 0) {
    return (
      <div className="history-page">
        <h1 className="history-title">Game History</h1>
        <p className="no-history">No games played yet.</p>
        <button className="back-btn" onClick={() => navigate("/")}>
          ⬅ Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="history-page">
      <h1 className="history-title">Game History</h1>

      <div className="card-grid">
        {games.map((game) => (
          <div key={game.id} className="history-card">
            <div className="card-header">
              <h3 className="card-title">
                {game.player_white} <span className="vs-text">vs</span>{" "}
                {game.player_black}
              </h3>
            </div>
            <div className="card-body">
              <p>
                <strong>Result:</strong> {game.result}
              </p>
              <p>
                <strong>Moves:</strong> {game.moves_count}
              </p>
              <p className="card-date">
                <strong>Date:</strong>{" "}
                {new Date(game.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="back-btn" onClick={() => navigate("/")}>
        ⬅ Back Home
      </button>
    </div>
  );
}