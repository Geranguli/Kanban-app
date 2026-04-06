import { useDispatch } from "react-redux";
import { deleteCard } from "../../store/cardsSlice";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function CardItem({ card, onEdit }) {
  const dispatch = useDispatch();

  // подключаем карточку к dnd-kit как перетаскиваемый элемент
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* область для перетаскивания */}
      <div {...attributes} {...listeners}>
        ⠿
      </div>

      <div>{card.title}</div>
      <div>{card.description}</div>
      <div>{card.due_date}</div>

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
    </div>
  );
}

export default CardItem;
