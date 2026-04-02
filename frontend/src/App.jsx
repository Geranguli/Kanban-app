import { Routes, Route } from "react-router-dom";
import Auth from "./pages/auth";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
    </Routes>
  );
}

export default App;
