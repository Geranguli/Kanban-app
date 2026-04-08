import { useDispatch } from "react-redux";
import { deleteCard } from "../../store/cardsSlice";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function CardItem({ card, onEdit }) {
  const dispatch = useDispatch();

  // подключаем карточку к dnd-kit как перетаскиваемый элемент
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // карточка полупрозрачна во время перетаскивания
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* область для перетаскивания */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: "grab" }}
        onClick={(e) => e.stopPropagation()} //чтобы drag не конфликтовал с кликами
      >
        ⠿
      </div>
      <div>{card.title || "Без названия"}</div>
      {card.description && <div>{card.description}</div>}
      {/* не рендерим пустые блоки */}
      {card.due_date && <div>{card.due_date}</div>}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(card);
        }}
      >
        Edit
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          dispatch(deleteCard(card.id));
        }}
      >
        Delete
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
