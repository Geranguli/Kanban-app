import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// получить карточки колонки
export const fetchCards = createAsyncThunk(
  "cards/fetchCards",
  async (columnId) => {
    const res = await api.get(`/cards/?column_id=${columnId}`);
    return { columnId, cards: res.data };
  },
);

// создать карточку
export const createCard = createAsyncThunk(
  "cards/createCard",
  async ({ columnId, card }) => {
    const res = await api.post(`/cards/?column_id=${columnId}`, card);
    return res.data;
  },
);

// thunk для drag-and-drop: отправляем новую колонку и позицию
export const moveCard = createAsyncThunk(
  "cards/moveCard",
  async ({ cardId, newColumn, newPosition }) => {
    const res = await api.patch(`/cards/${cardId}/move`, {
      new_column: newColumn,
      new_position: newPosition,
    });
    return res.data;
  },
);

// удалить карточку
export const deleteCard = createAsyncThunk(
  "cards/deleteCard",
  async (cardId) => {
    await api.delete(`/cards/${cardId}`);
    return cardId;
  },
);

// обновить карточку
export const updateCard = createAsyncThunk(
  "cards/updateCard",
  async ({ cardId, data }) => {
    const res = await api.put(`/cards/${cardId}`, data);
    return res.data;
  },
);

//добавить изображение
export const uploadImages = createAsyncThunk(
  "cards/uploadImages",
  async ({ cardId, files }) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await api.post(`/cards/${cardId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },
);

//удалить изображение
export const deleteImage = createAsyncThunk(
  "cards/deleteImage",
  async (imageId) => {
    await api.delete(`/cards/images/${imageId}`);
    return imageId;
  },
);

const cardsSlice = createSlice({
  name: "cards",
  initialState: {
    cards: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = state.cards.filter(
          (c) => c.column_id !== action.payload.columnId,
        );
        state.cards.push(...action.payload.cards);
      })
      .addCase(fetchCards.rejected, (state) => {
        state.loading = false;
        state.error = "Ошибка загрузки карточек";
      })
      /*.addCase(createCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })*/
      .addCase(createCard.fulfilled, (state, action) => {
        //state.loading = false;
        //state.error = null;
        state.cards.push(action.payload);
      })
      .addCase(createCard.rejected, (state, action) => {
        state.loading = false;
        state.error =
          //action.error?.message ||
          action.payload;
        //"Невозможно создать карточку";
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.cards = state.cards.filter((c) => c.id !== action.payload);
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        const index = state.cards.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.cards[index] = action.payload;
      })
      .addCase(uploadImages.fulfilled, (state, action) => {
        const updatedCard = action.payload;
        const index = state.cards.findIndex((c) => c.id === updatedCard.id);
        if (index !== -1) {
          state.cards[index] = updatedCard;
        }
      })
      //обновляем карточки после перемещения
      .addCase(moveCard.fulfilled, (state, action) => {
        const index = state.cards.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.cards[index] = action.payload;
      });
  },
});

export default cardsSlice.reducer;
