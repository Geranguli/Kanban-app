import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// логин/регистрация: если пользователь есть - входим, нет - создаём
export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (username, { rejectWithValue }) => {
    try {
      const res = await api.post("/users/login", { username });
      // сохраняем пользователя в localStorage чтобы не терять после перезагрузки
      localStorage.setItem("user", JSON.stringify(res.data));
      return res.data;
    } catch {
      return rejectWithValue("Ошибка авторизации");
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    // восстанавливаем пользователя из localStorage при загрузке
    user: JSON.parse(localStorage.getItem("user")),
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
