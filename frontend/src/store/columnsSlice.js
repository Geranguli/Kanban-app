import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// получить колонки
export const fetchColumns = createAsyncThunk(
  "columns/fetchColumns",
  async (boardId) => {
    const res = await api.get(`/columns/?board_id=${boardId}`);
    return res.data;
  },
);

// создать новую колонку
export const createColumn = createAsyncThunk(
  "columns/createColumn",
  async ({ boardId, title }) => {
    const res = await api.post(`/columns/?board_id=${boardId}`, { title });
    return res.data;
  },
);

// удалить колонку
export const deleteColumn = createAsyncThunk(
  "columns/deleteColumn",
  async (columnId) => {
    await api.delete(`/columns/${columnId}`);
    return columnId; // Возвращаем id для удаления из стейта
  },
);

// обновить заголовок колонки
export const updateColumn = createAsyncThunk(
  "columns/updateColumn",
  async ({ columnId, title }) => {
    const res = await api.put(`/columns/${columnId}`, { title });
    return res.data;
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
      .addCase(fetchColumns.pending, (state) => {
        state.loading = true;
        state.error = null; // сбрасываем ошибку при новом запросе
      })
      .addCase(fetchColumns.fulfilled, (state, action) => {
        state.loading = false;
        state.columns = action.payload;
      })
      .addCase(fetchColumns.rejected, (state) => {
        state.loading = false;
        state.error = "Ошибка загрузки колонок";
      })
      .addCase(createColumn.fulfilled, (state, action) => {
        state.columns.push(action.payload);
      })
      .addCase(deleteColumn.fulfilled, (state, action) => {
        state.columns = state.columns.filter((c) => c.id !== action.payload);
      })
      .addCase(updateColumn.fulfilled, (state, action) => {
        const index = state.columns.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) state.columns[index] = action.payload;
      });
  },
});

export default columnsSlice.reducer;
