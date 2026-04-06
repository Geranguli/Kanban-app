import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateCard } from "../../store/cardsSlice";

function CardModal({ card, onClose }) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  // заполняем форму данными карточки при открытии
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || "",
        description: card.description || "",
        due_date: card.due_date || "",
      });
    }
  }, [card]);

  const handleSave = () => {
    dispatch(
      updateCard({
        cardId: card.id,
        data: {
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date || null,
        },
      }),
    );
    onClose();
  };

  // не рендерим модалку если карточка не выбрана
  if (!card) return null;

  return (
    // клик по фону закрывает модалку
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* клик внутри окна не закрывает его */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          padding: 20,
          borderRadius: 8,
          width: 320,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <h3>Edit card</h3>

        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Title"
        />

        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Description"
        />

        <input
          type="date"
          value={formData.due_date || ""}
          onChange={(e) =>
            setFormData({ ...formData, due_date: e.target.value })
          }
        />

        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default CardModal;
