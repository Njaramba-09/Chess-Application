import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Play from "./Play";
import History from "./History";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="/history" element={<History />} />
    </Routes>
  );
}