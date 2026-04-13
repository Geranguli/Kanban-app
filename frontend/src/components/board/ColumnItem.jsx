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

  //loading из глобала (ошибки - локальные) для создания карточки
  const { loading: cardLoading } = useSelector((state) => state.cards);

  // локальный loading для колонки (редактирование/удаление)
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (err) {
      setError(err?.message || err || "Ошибка создания карточки");
      console.error("Ошибка создания карточки:", err);
    }
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
        `.column input[placeholder="Title"]`,
      );
      input?.focus();
    }, 0);
  };

  // общий loading статус
  const loading = isLoading || cardLoading;

  return (
    <div
      ref={setNodeRef}
      className="column"
      style={{
        minHeight: "150px",
        background: isOver ? "#e3f2fd" : "#f4f5f7",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      {editing ? (
        <>
          <input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateColumn}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateColumn();
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleUpdateColumn}
            disabled={isLoading}
            className={isLoading ? "loading" : ""}
          >
            {isLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </>
      ) : (
        <>
          <h3>{column.title}</h3>
          <button
            onClick={() => !isLoading && setEditing(true)}
            disabled={isLoading}
          >
            Edit
          </button>
          <button onClick={handleDeleteColumn} disabled={isLoading}>
            {isLoading ? "Удаление..." : "Delete"}
          </button>
        </>
      )}
      {error && (
        <div className="error">
          <p>{error}</p>

          {lastCardData && (
            <button onClick={handleRetry} disabled={loading}>
              Исправить и повторить
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

      <div className="form">
        <input
          placeholder="Title"
          value={newCard.title}
          onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateCard();
          }}
          disabled={cardLoading}
        />
        <textarea
          placeholder="Description"
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
          onChange={(e) => setNewCard({ ...newCard, due_date: e.target.value })}
          disabled={cardLoading}
        />
        <button onClick={handleCreateCard} disabled={loading}>
          {loading ? "Создание..." : "Add card"}
        </button>
      </div>
    </div>
  );
}

export default ColumnItem;
