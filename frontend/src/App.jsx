/**
 * Корневой компонент приложения с маршрутизацией
 *
 * Маршруты:
 * - /login - страница авторизации
 * - / - главная страница со списком досок
 * - /boards/:id - страница конкретной доски
 */

import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Auth from "./pages/auth";
import Board from "./pages/board";
import "./index.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/" element={<Home />} />
      <Route path="/boards/:id" element={<Board />} />
    </Routes>
  );
}

export default App;
