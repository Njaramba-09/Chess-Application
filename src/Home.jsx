import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">♟ Bree’s Chess</h1>
        <p className="home-subtitle">Strategize. Think. Conquer.</p>
        <div className="home-buttons">
          <button className="home-btn play-btn" onClick={() => navigate("/play")}>
            Play Game
          </button>
          <button className="home-btn history-btn" onClick={() => navigate("/history")}>
            View History
          </button>
        </div>
      </div>
    </div>
  );
}