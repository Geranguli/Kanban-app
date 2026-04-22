/**
 * Redux Slice для управления досками
 *
 * Использует createAsyncThunk для асинхронных операций
 * Разделение loading (для fetch) и actionLoading/actionType:
 * - loading: спиннер при первичной загрузке
 * - actionLoading + actionType: индикация конкретной операции (создание/удаление)
 *
 * Все thunk возвращают данные через unwrap() для обработки в компонентах
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// получить все доски пользователя
export const fetchBoards = createAsyncThunk(
  "boards/fetchBoards",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/boards/?user_id=${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// создать новую доску
export const createBoard = createAsyncThunk(
  "boards/createBoard",
  async ({ title, userId }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/boards?user_id=${userId}`, { title });
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// удалить доску
export const deleteBoard = createAsyncThunk(
  "boards/deleteBoard",
  async (boardId, { rejectWithValue }) => {
    try {
      await api.delete(`/boards/${boardId}`);
      return boardId;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// удалить все доски
export const deleteAllBoards = createAsyncThunk(
  "boards/deleteAllBoards",
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/boards/?user_id=${userId}`);
      return userId;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// переименовать доску
export const updateBoard = createAsyncThunk(
  "boards/updateBoard",
  async ({ boardId, title }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/boards/${boardId}`, { title });
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

const boardsSlice = createSlice({
  name: "boards",
  initialState: {
    boards: [],
    loading: false, // только для fetch
    actionLoading: false, // для create/update/delete
    actionType: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      //fetch
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Ошибка загрузки досок";
      })
      //create
      .addCase(createBoard.pending, (state) => {
        state.actionLoading = true;
        state.actionType = "create";
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionType = null;
        state.boards.push(action.payload);
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionType = null;
        state.error = action.payload || "Ошибка создания доски";
      })
      //delete
      .addCase(deleteBoard.pending, (state) => {
        state.actionLoading = true;
        state.actionType = "delete";
        state.error = null;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionType = null;
        state.boards = state.boards.filter((b) => b.id !== action.payload);
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionType = null;
        state.error = action.payload || "Ошибка удаления доски";
      })
      //delete all
      .addCase(deleteAllBoards.pending, (state) => {
        state.actionLoading = true;
        state.actionType = "deleteAll";
        state.error = null;
      })
      .addCase(deleteAllBoards.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionType = null;
        state.boards = [];
      })
      .addCase(deleteAllBoards.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionType = null;
        state.error = action.payload || "Ошибка удаления досок";
      })
      //update
      .addCase(updateBoard.pending, (state) => {
        state.actionLoading = true;
        state.actionType = "update";
        state.error = null;
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionType = null;
        const index = state.boards.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) state.boards[index] = action.payload;
      })
      .addCase(updateBoard.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionType = null;
        state.error = action.payload || "Ошибка обновления доски";
      });
  },
});

export default boardsSlice.reducer;
