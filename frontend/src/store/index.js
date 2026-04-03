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
