import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteColumn, updateColumn } from "../../store/columnsSlice";
import { createCard } from "../../store/cardsSlice";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import CardItem from "./CardItem";

function ColumnItem({ column, cards, onEditCard }) {
  const dispatch = useDispatch();

  const { loading: cardLoading, actionType: cardActionType } = useSelector(
    (state) => state.cards,
  );

  // локальный loading для колонки (редактирование/удаление)
  const [isLoading, setIsLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);

  // делаем колонку drop-зоной для карточек
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });
  //редактирование колонки
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  //создание карточки
  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  //локальная ошибка не влияет на другие колонки
  const [error, setError] = useState(null);
  //сохраняем данные последней попытки для кнопки повторить
  const [lastCardData, setLastCardData] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const handleUpdateColumn = async () => {
    if (!title.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      await dispatch(updateColumn({ columnId: column.id, title })).unwrap();

      setEditing(false);
    } catch (err) {
      setError(err?.message || "Ошибка обновления колонки");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteColumn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await dispatch(deleteColumn(column.id)).unwrap();
    } catch (err) {
      setError(err?.message || "Ошибка удаления колонки");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCard = async () => {
    const cardData = {
      title: newCard.title,
      description: newCard.description || null,
      due_date: newCard.due_date || null,
    };
    if (!cardData.title.trim()) return;

    setError(null);
    setLastCardData(cardData); // сохраняем на случай ошибки

    try {
      await dispatch(
        createCard({
          columnId: column.id,
          card: cardData,
        }),
      ).unwrap();

      // очищаем форму
      setNewCard({
        title: "",
        description: "",
        due_date: "",
      });

      setLastCardData(null);
      setShowForm(false);
    } catch (err) {
      setError(err?.message || err || "Ошибка создания карточки");
      console.error("Ошибка создания карточки:", err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setNewCard({ title: "", description: "", due_date: "" });
    setError(null);
  };

  //восстановление формы при "повторить"
  const handleRetry = () => {
    if (!lastCardData) return;

    setNewCard({
      title: lastCardData.title || "",
      description: lastCardData.description || "",
      due_date: lastCardData.due_date || "",
    });

    setError(null);

    // фокус на заголовок
    setTimeout(() => {
      const input = document.querySelector(
        `.card-form input[placeholder="Заголовок"]`,
      );
      input?.focus();
    }, 0);
  };

  return (
    <div
      ref={setNodeRef}
      className={`column${isOver ? " drag-over" : ""}${isLoading ? " loading" : ""}`}
    >
      <div className="column-header">
        {editing ? (
          <>
            <input
              className="input"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateColumn}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateColumn();
              }}
              disabled={isLoading}
            />
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="column-title">{column.title}</span>
            </div>

            <div className="column-actions">
              <button
                onClick={() => !isLoading && setEditing(true)}
                disabled={isLoading}
                className="column-action-btn"
                title="Редактировать"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
              <button
                onClick={handleDeleteColumn}
                disabled={isLoading}
                className="column-action-btn"
                title="Удалить колонку"
              >
                {isLoading ? (
                  <span className="spinner" />
                ) : (
                  <i className="fa-solid fa-xmark"></i>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {editing && (
        <button
          onClick={handleUpdateColumn}
          disabled={isLoading}
          className={`btn btn-primary mt-6 ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              <span className="loading-text">Сохранение...</span>
            </>
          ) : (
            "Сохранить"
          )}
        </button>
      )}
      {error && (
        <div className="error-box mt-8">
          <p style={{ margin: 0 }}>{error}</p>

          {lastCardData && (
            <button
              onClick={handleRetry}
              //disabled={loading}
              className="btn btn-primary"
            >
              Повторить
            </button>
          )}
        </div>
      )}

      {/*передаем id карточек для правильного расчета позиций */}
      <SortableContext
        items={cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        {cards.map((card) => (
          <CardItem key={card.id} card={card} onEdit={onEditCard} />
        ))}
      </SortableContext>

      {showForm ? (
        <div className="card-form">
          <input
            placeholder="Заголовок"
            value={newCard.title}
            onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleCreateCard();
            }}
            disabled={cardLoading}
            autoFocus
          />
          <textarea
            placeholder="Описание"
            value={newCard.description}
            onChange={(e) =>
              setNewCard({ ...newCard, description: e.target.value })
            }
            disabled={cardLoading}
          />
          <input
            type="date"
            min={today}
            value={newCard.due_date}
            onChange={(e) =>
              setNewCard({ ...newCard, due_date: e.target.value })
            }
            disabled={cardLoading}
          />
          <div className="card-form-actions">
            <button
              onClick={handleCreateCard}
              disabled={cardLoading && cardActionType === "create"}
              className="btn btn-primary"
            >
              {cardLoading && cardActionType === "create" ? (
                <>
                  <span className="spinner"></span>
                  <span className="loading-text">Создание...</span>
                </>
              ) : (
                "Добавить"
              )}
            </button>
            <button onClick={handleCancel} className="btn btn-ghost">
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="add-card-btn mt-6">
          + Добавить карточку
        </button>
      )}
    </div>
  );
}

export default ColumnItem;
