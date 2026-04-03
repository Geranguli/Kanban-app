import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Auth from "./pages/auth";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
