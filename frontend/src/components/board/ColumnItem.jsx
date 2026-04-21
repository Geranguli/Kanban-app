import { useState, memo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteColumn, updateColumn } from "../../store/columnsSlice";
import { createCard } from "../../store/cardsSlice";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import CardItem from "./CardItem";

const ColumnItem = memo(function ColumnItem({ column, cards, onEditCard }) {
  const dispatch = useDispatch();
  const columnRef = useRef(null);

  const { loading: cardLoading, actionType: cardActionType } = useSelector(
    (state) => state.cards,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [error, setError] = useState(null);
  const [lastCardData, setLastCardData] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  // Droppable для самой колонки
  const { setNodeRef: setColumnRef, isOver: isColumnOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  // Droppable для пустой зоны внутри колонки
  const { setNodeRef: setEmptyRef, isOver: isEmptyOver } = useDroppable({
    id: `column-empty-${column.id}`,
    data: {
      type: "empty-zone",
      columnId: column.id,
    },
  });

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
    setLastCardData(cardData);

    try {
      await dispatch(
        createCard({
          columnId: column.id,
          card: cardData,
        }),
      ).unwrap();

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

  const handleRetry = () => {
    if (!lastCardData) return;
    setNewCard({
      title: lastCardData.title || "",
      description: lastCardData.description || "",
      due_date: lastCardData.due_date || "",
    });
    setError(null);
    setTimeout(() => {
      const input = document.querySelector(
        `.card-form input[placeholder="Заголовок"]`,
      );
      input?.focus();
    }, 0);
  };

  // Определяем, есть ли drag over на колонке или пустой зоне
  const isDragOver = isColumnOver || isEmptyOver;

  return (
    <div
      ref={(node) => {
        setColumnRef(node);
        columnRef.current = node;
      }}
      className={`column${isDragOver ? " drag-over" : ""}${isLoading ? " loading" : ""}`}
    >
      <div className="column-header">
        {editing ? (
          <input
            className="input column-title-input"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateColumn}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.target.blur(); // blur → onBlur → сохранение
              if (e.key === "Escape") {
                setEditing(false);
                setTitle(column.title);
              }
            }}
            disabled={isLoading}
          />
        ) : (
          <span
            className="column-title"
            onClick={() => !isLoading && setEditing(true)}
            title="Нажмите для редактирования"
          >
            {column.title}
          </span>
        )}

        <div className="column-actions">
          <button
            onClick={handleDeleteColumn}
            disabled={isLoading}
            className="column-action-btn column-action-btn--delete"
            title="Удалить колонку"
          >
            {isLoading ? (
              <span className="spinner" />
            ) : (
              <i className="fa-solid fa-xmark"></i>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box mt-8">
          <p>{error}</p>
          {lastCardData && (
            <button onClick={handleRetry} className="btn btn-retry">
              Повторить
            </button>
          )}
        </div>
      )}

      <div className="column-body">
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onEdit={onEditCard} />
          ))}
        </SortableContext>

        {/* Пустая зона для бросания карточек */}
        <div
          ref={setEmptyRef}
          className={`column-empty-zone ${isEmptyOver ? "drag-over" : ""} ${cards.length === 0 ? "visible" : ""}`}
        >
          {cards.length === 0 && "Перетащите карточку сюда"}
        </div>
      </div>

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
});

export default ColumnItem;
