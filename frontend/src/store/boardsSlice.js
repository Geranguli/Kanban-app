import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// получить все доски пользователя
export const fetchBoards = createAsyncThunk(
  "boards/fetchBoards",
  async (userId) => {
    const res = await api.get(`/boards/?user_id=${userId}`);
    return res.data;
  },
);

// создать новую доску
export const createBoard = createAsyncThunk(
  "boards/createBoard",
  async ({ title, userId }) => {
    const res = await api.post(`/boards?user_id=${userId}`, { title });
    return res.data;
  },
);

// удалить доску
export const deleteBoard = createAsyncThunk(
  "boards/deleteBoard",
  async (boardId) => {
    await api.delete(`/boards/${boardId}`);
    return boardId;
  },
);

// переименовать доску
export const updateBoard = createAsyncThunk(
  "boards/updateBoard",
  async ({ boardId, title }) => {
    const res = await api.put(`/boards/${boardId}`, { title });
    return res.data;
  },
);

const boardsSlice = createSlice({
  name: "boards",
  initialState: {
    boards: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload;
      })
      .addCase(fetchBoards.rejected, (state) => {
        state.loading = false;
        state.error = "Ошибка загрузки досок";
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.boards.push(action.payload);
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter((b) => b.id !== action.payload);
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        const index = state.boards.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.boards[index] = action.payload;
        }
      });
  },
});

export default boardsSlice.reducer;
