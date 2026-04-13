import { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteCard } from "../../store/cardsSlice";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function CardItem({ card, onEdit }) {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // подключаем карточку к dnd-kit как перетаскиваемый элемент
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = card.due_date && new Date(card.due_date) < new Date();

  const handleDelete = async (e) => {
    e.stopPropagation();
    setError(null);
    setIsLoading(true);

    try {
      await dispatch(deleteCard(card.id)).unwrap();
    } catch (err) {
      setError(err || "Ошибка удаления карточки");
      setIsLoading(false);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (!isLoading) {
      onEdit(card);
    }
  };
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
      }}
      className={`card ${isDragging ? "dragging" : ""}`}
    >
      {/* область для перетаскивания */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: isLoading ? "not-allowed" : "grab" }}
        onClick={(e) => e.stopPropagation()} //чтобы drag не конфликтовал с кликами
      >
        ⠿
      </div>
      <div>{card.title || "Без названия"}</div>
      {card.description && <div>{card.description}</div>}
      {/* не рендерим пустые блоки */}
      {card.due_date && (
        <div className={isOverdue ? "overdue" : ""}>{card.due_date}</div>
      )}

      {error && (
        <div
          style={{
            color: "#dc2626",
            fontSize: "12px",
            margin: "4px 0",
            background: "#fee2e2",
            padding: "4px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}
      <button onClick={handleEdit} disabled={isLoading}>
        Edit
      </button>
      <button onClick={handleDelete} disabled={isLoading}>
        {isLoading ? "Удаление..." : "Delete"}
      </button>
      {card.images && card.images.length > 0 && (
        <div className="card-images">
          {card.images.map((img) => (
            <img
              key={img.id}
              src={`http://localhost:8000/${img.url}`}
              alt=""
              style={{ width: "100%", borderRadius: "6px" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CardItem;
