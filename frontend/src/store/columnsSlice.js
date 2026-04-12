import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// получить колонки
export const fetchColumns = createAsyncThunk(
  "columns/fetchColumns",
  async (boardId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/columns/?board_id=${boardId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// создать новую колонку
export const createColumn = createAsyncThunk(
  "columns/createColumn",
  async ({ boardId, title }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/columns/?board_id=${boardId}`, { title });
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// удалить колонку
export const deleteColumn = createAsyncThunk(
  "columns/deleteColumn",
  async (columnId, { rejectWithValue }) => {
    try {
      await api.delete(`/columns/${columnId}`);
      return columnId; // Возвращаем id для удаления из стейта
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// обновить заголовок колонки
export const updateColumn = createAsyncThunk(
  "columns/updateColumn",
  async ({ columnId, title }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/columns/${columnId}`, { title });
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

const columnsSlice = createSlice({
  name: "columns",
  initialState: {
    columns: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      //fetch
      .addCase(fetchColumns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchColumns.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload;
      })
      .addCase(fetchColumns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Ошибка загрузки колонок";
      })
      //create
      .addCase(createColumn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.columns.push(action.payload);
      })
      .addCase(createColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Ошибка создания колонки";
      })
      //delete
      .addCase(deleteColumn.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteColumn.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = state.columns.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Ошибка удаления колонки";
      })
      //update
      .addCase(updateColumn.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateColumn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.columns.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) state.columns[index] = action.payload;
      })
      .addCase(updateColumn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Ошибка обновления колонки";
      });
  },
});

export default columnsSlice.reducer;
