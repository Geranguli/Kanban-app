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
      columnId: card.column_id, // Для определения исходной колонки
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const images = card.images || [];
  const coverImage = images.length > 0 ? images[0] : null;

  const isOverdue = card.due_date && new Date(card.due_date) < new Date();

  const handleDelete = async (e) => {
    e.stopPropagation();
    setError(null);
    setIsLoading(true);

    try {
      await dispatch(deleteCard(card.id)).unwrap();
    } catch (err) {
      setError(err || "Ошибка удаления карточки");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (!isLoading) {
      onEdit(card);
    }
  };

  const handleImgDragStart = (e) => {
    e.preventDefault();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${isDragging ? "dragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      {coverImage && (
        <div className="card-cover-wrap">
          <img
            src={`http://localhost:8000/${coverImage.url}`}
            alt=""
            className="card-cover"
            onClick={(e) => e.stopPropagation()}
            onDragStart={handleImgDragStart}
          />
        </div>
      )}

      <div className="card-body">
        <div className="card-header">
          <div className="card-title">{card.title || "Без названия"}</div>
        </div>

        {card.description && (
          <div className="card-desc">{card.description}</div>
        )}

        <div className="card-images-row">
          {images.length > 0 && (
            <div className="card-images-count">
              <i className="fa-regular fa-image"></i>
              {images.length}
            </div>
          )}
          <div className="card-actions">
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="card-btn card-btn-edit"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <i className="fa-solid fa-pen"></i>
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="card-btn card-btn-del"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {isLoading ? (
                <span className="spinner-sm"></span>
              ) : (
                <i className="fa-solid fa-xmark"></i>
              )}
            </button>
          </div>
        </div>

        <div className="card-footer">
          {card.due_date && (
            <span className={`card-due ${isOverdue ? "overdue" : "ok"}`}>
              {card.due_date}
            </span>
          )}
        </div>
        {error && <div className="error-inline mt-8">{error}</div>}
      </div>
    </div>
  );
}

export default CardItem;
