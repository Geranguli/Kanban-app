import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

//загрузка пользователя из localStorage
const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // валидация
    if (!parsed || !parsed.id || !parsed.username) {
      throw new Error("Invalid user data");
    }

    return parsed;
  } catch {
    //чистим localstorage
    localStorage.removeItem("user");
    return null;
  }
};

// логин/регистрация: если пользователь есть - входим, нет - создаём
export const loginUser = createAsyncThunk(
  "user/loginUser",
  async (username, { rejectWithValue }) => {
    try {
      const res = await api.post("/users/login", { username });
      // сохраняем пользователя в localStorage, чтобы не терять после перезагрузки
      localStorage.setItem("user", JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || "Ошибка авторизации",
      );
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: loadUserFromStorage(),
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.error = null;
      localStorage.removeItem("user");
    },
    clearError(state) {
      state.error = null;
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
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Ошибка авторизации";
      });
  },
});

export const { logout, clearError } = userSlice.actions;
export default userSlice.reducer;
