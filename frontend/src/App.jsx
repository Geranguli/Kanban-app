import { Routes, Route } from "react-router-dom";
import "./App.css";

// страницы позже
function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
    </Routes>
  );
}

export default App;
