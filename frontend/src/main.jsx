/**
 * Точка входа React-приложения
 *
 * Инициализирует:
 * - Redux Provider для глобального стейта
 * - BrowserRouter для маршрутизации
 */

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./store/index";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
);
