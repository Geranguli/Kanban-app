/**
 * Конфигурация Redux store
 *
 * Используем configureStore из Redux Toolkit -
 * автоматически подключает Redux DevTools и thunk middleware
 *
 * Структура стейта:
 * - user: текущий пользователь (из localStorage)
 * - boards: список досок (главная страница)
 * - columns: колонки текущей доски
 * - cards: карточки текущей доски (плоский массив)
 */

import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import boardsReducer from "./boardsSlice";
import columnsReducer from "./columnsSlice";
import cardsReducer from "./cardsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    boards: boardsReducer,
    columns: columnsReducer,
    cards: cardsReducer,
  },
});
