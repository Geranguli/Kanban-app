import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// получить карточки колонки
export const fetchCards = createAsyncThunk(
  "cards/fetchCards",
  async (columnId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/cards/?column_id=${columnId}`);
      return { columnId, cards: res.data };
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// создать карточку
export const createCard = createAsyncThunk(
  "cards/createCard",
  async ({ columnId, card }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/cards/?column_id=${columnId}`, card);
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// thunk для drag-and-drop: отправляем новую колонку и позицию
export const moveCard = createAsyncThunk(
  "cards/moveCard",
  async ({ cardId, newColumn, newPosition }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/cards/${cardId}/move`, {
        new_column: newColumn,
        new_position: newPosition,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// удалить карточку
export const deleteCard = createAsyncThunk(
  "cards/deleteCard",
  async (cardId, { rejectWithValue }) => {
    try {
      await api.delete(`/cards/${cardId}`);
      return cardId;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// обновить карточку
export const updateCard = createAsyncThunk(
  "cards/updateCard",
  async ({ cardId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/cards/${cardId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

//добавить изображение
export const uploadImages = createAsyncThunk(
  "cards/uploadImages",
  async ({ cardId, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await api.post(`/cards/${cardId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

//удалить изображение
export const deleteImage = createAsyncThunk(
  "cards/deleteImage",
  async (imageId, { rejectWithValue }) => {
    try {
      await api.delete(`/cards/images/${imageId}`);
      return imageId;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

const cardsSlice = createSlice({
  name: "cards",
  initialState: {
    cards: [],
    loading: false,
    actionType: null,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    //меняем стейт до ответа сервера
    moveCardOptimistic(state, action) {
      const { cardId, newColumn, newPosition } = action.payload;

      const card = state.cards.find((c) => c.id === cardId);
      if (!card) return;

      const oldColumn = card.column_id;
      const oldPosition = card.position;

      const sameColumn = oldColumn === newColumn;

      if (sameColumn) {
        //внутри той же колонки
        state.cards.forEach((c) => {
          if (c.column_id !== oldColumn || c.id === cardId) return;

          // сдвигаем вниз - карточки сдвигаются вверх
          if (newPosition < oldPosition) {
            if (c.position >= newPosition && c.position < oldPosition) {
              c.position += 1;
            }
          }
          // сдвигаем вверх - карточки сдвигаются вниз
          else if (newPosition > oldPosition) {
            if (c.position <= newPosition && c.position > oldPosition) {
              c.position -= 1;
            }
          }
        });
      } else {
        // разные колонки
        state.cards.forEach((c) => {
          //в старой колонке карточки - верх
          if (c.column_id === newColumn && c.position >= newPosition) {
            c.position += 1;
          }
          //в новой карточки - вниз
          if (c.column_id === oldColumn && c.position > oldPosition) {
            c.position -= 1;
          }
        });
      }

      card.column_id = newColumn;
      card.position = newPosition;
    },
  },

  extraReducers: (builder) => {
    builder
      //fetch
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
      //create
      .addCase(createCard.pending, (state) => {
        state.loading = true;
        state.actionType = "create";
        state.error = null;
      })
      .addCase(createCard.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.cards.push(action.payload);
      })
      .addCase(createCard.rejected, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.error =
          action.payload?.message ||
          action.payload ||
          "Ошибка создания карточки";
      })
      //delete
      .addCase(deleteCard.pending, (state) => {
        state.loading = true;
        state.actionType = "delete";
        state.error = null;
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.cards = state.cards.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCard.rejected, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.error =
          action.payload?.message ||
          action.payload ||
          "Ошибка удаления карточки";
      })
      //update
      .addCase(updateCard.pending, (state) => {
        state.loading = true;
        state.actionType = "update";
        state.error = null;
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
        const index = state.cards.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.cards[index] = action.payload;
        }
      })
      .addCase(updateCard.rejected, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.error =
          action.payload?.message || action.payload || "Ошибка обновления";
      })
      //upload
      .addCase(uploadImages.pending, (state) => {
        state.loading = true;
        state.actionType = "upload";
        state.error = null;
      })
      .addCase(uploadImages.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
        const index = state.cards.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.cards[index] = action.payload;
        }
      })
      .addCase(uploadImages.rejected, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.error =
          action.payload?.message ||
          action.payload ||
          "Ошибка загрузки изображений";
      })
      //deleteImage
      .addCase(deleteImage.pending, (state) => {
        state.loading = true;
        state.actionType = "deleteImage";
        state.error = null;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
        // Находим карточку и удаляем картинку из её массива
        const card = state.cards.find((c) =>
          c.images?.some((img) => img.id === action.payload),
        );
        if (card) {
          card.images = card.images.filter((img) => img.id !== action.payload);
        }
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.error =
          action.payload?.message ||
          action.payload ||
          "Ошибка удаления изображения";
      })
      //обновляем карточки после перемещения
      .addCase(moveCard.pending, (state) => {
        state.loading = true;
        state.actionType = "moveCard";
        state.error = null;
      })
      .addCase(moveCard.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
        const index = state.cards.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.cards[index] = action.payload;
      })
      .addCase(moveCard.rejected, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.error = action.payload || "Ошибка перемещения";
      });
  },
});

export const { moveCardOptimistic, clearError } = cardsSlice.actions;

export default cardsSlice.reducer;
