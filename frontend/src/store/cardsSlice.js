import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

//  один запрос на всю доску
export const fetchBoardCards = createAsyncThunk(
  "cards/fetchBoardCards",
  async (boardId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/cards/board/${boardId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

// Оставляем для создания/редактирования в модалке
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

// moveCard возвращает все карточки доски
export const moveCard = createAsyncThunk(
  "cards/moveCard",
  async ({ cardId, newColumn, newPosition }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/cards/${cardId}/move`, {
        new_column: newColumn,
        new_position: newPosition,
      });
      return res.data; // теперь это массив ВСЕХ карточек доски
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

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
    //  локально двигаем карточку
    moveCardOptimistic(state, action) {
      const { cardId, newColumn, newPosition } = action.payload;

      const oldIndex = state.cards.findIndex((c) => c.id === cardId);
      if (oldIndex === -1) return;

      const card = { ...state.cards[oldIndex] };

      // Удаляем из старого места
      state.cards.splice(oldIndex, 1);

      // Меняем колонку
      card.column_id = newColumn;

      // Находим карточки новой колонки (уже без перемещаемой)
      const cardsInColumn = state.cards.filter(
        (c) => c.column_id === newColumn,
      );

      let insertIndex;
      if (cardsInColumn.length === 0) {
        insertIndex = state.cards.length;
      } else if (newPosition >= cardsInColumn.length) {
        const lastCard = cardsInColumn[cardsInColumn.length - 1];
        insertIndex = state.cards.findIndex((c) => c.id === lastCard.id) + 1;
      } else {
        const targetCard = cardsInColumn[newPosition];
        insertIndex = state.cards.findIndex((c) => c.id === targetCard.id);
      }

      // Вставляем в нужное место
      state.cards.splice(insertIndex, 0, card);

      // Пересчитываем position для всех карточек
      const grouped = {};
      state.cards.forEach((c) => {
        if (!grouped[c.column_id]) grouped[c.column_id] = [];
        grouped[c.column_id].push(c);
      });
      Object.values(grouped).forEach((arr) => {
        arr.forEach((c, i) => {
          c.position = i;
        });
      });
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchBoardCards
      .addCase(fetchBoardCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoardCards.fulfilled, (state, action) => {
        state.loading = false;
        //  заменяем массив
        state.cards = action.payload;
      })
      .addCase(fetchBoardCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Ошибка загрузки карточек";
      })
      // fetchCards
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
      // create
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
      // delete
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
      // update
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
      // upload
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
      // deleteImage
      .addCase(deleteImage.pending, (state) => {
        state.loading = true;
        state.actionType = "deleteImage";
        state.error = null;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
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
      // moveCard
      .addCase(moveCard.pending, (state) => {
        state.loading = true;
        state.actionType = "moveCard";
        state.error = null;
      })
      .addCase(moveCard.fulfilled, (state, action) => {
        state.loading = false;
        state.actionType = null;
        state.cards = action.payload;
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
