import { useDispatch } from "react-redux";
import { deleteCard } from "../../store/cardsSlice";

function CardItem({ card, onEdit }) {
  const dispatch = useDispatch();

  return (
    <div>
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
