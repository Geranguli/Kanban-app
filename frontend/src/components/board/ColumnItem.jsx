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

  // делаем колонку drop-зоной для карточек
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const today = new Date().toISOString().split("T")[0];
  const { error } = useSelector((state) => state.cards);

  const handleUpdateColumn = () => {
    if (!title.trim()) return;
    dispatch(updateColumn({ columnId: column.id, title }));
    setEditing(false);
  };

  const handleCreateCard = () => {
    if (!newCard.title.trim()) return;
    dispatch(
      createCard({
        columnId: column.id,
        card: {
          title: newCard.title,
          description: newCard.description || null,
          due_date: newCard.due_date || null,
        },
      }),
    );
    setNewCard({ title: "", description: "", due_date: "" });
  };

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
        <input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleUpdateColumn}
        />
      ) : (
        <>
          <h3>{column.title}</h3>
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={() => dispatch(deleteColumn(column.id))}>
            Delete
          </button>
        </>
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
        />
        <textarea
          placeholder="Description"
          value={newCard.description}
          onChange={(e) =>
            setNewCard({ ...newCard, description: e.target.value })
          }
        />
        <input
          type="date"
          min={today}
          value={newCard.due_date}
          onChange={(e) => setNewCard({ ...newCard, due_date: e.target.value })}
        />
        <button onClick={handleCreateCard}>Add card</button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default ColumnItem;
