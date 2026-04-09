import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateCard, uploadImages, deleteImage } from "../../store/cardsSlice";

function CardModal({ card, onClose }) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [newImages, setNewImages] = useState([]);

  // заполняем форму данными карточки при открытии
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || "",
        description: card.description || "",
        due_date: card.due_date || "",
      });
      setNewImages([]);
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
    if (newImages.length > 0) {
      dispatch(
        uploadImages({
          cardId: card.id,
          files: newImages,
        }),
      );
    }

    onClose();
  };

  // не рендерим модалку если карточка не выбрана
  if (!card) return null;

  return (
    // клик по фону закрывает модалку
    <div onClick={onClose} className="modal-overlay">
      {/* клик внутри окна не закрывает его */}
      <div onClick={(e) => e.stopPropagation()} className="modal">
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

        <div>
          <h4>Images</h4>

          {card.images && card.images.length > 0 ? (
            card.images.map((img) => (
              <div key={img.id} style={{ marginBottom: "10px" }}>
                <img
                  src={`http://localhost:8000/${img.url}`}
                  alt=""
                  style={{ width: "100px", borderRadius: "6px" }}
                />

                <button onClick={() => dispatch(deleteImage(img.id))}>
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p>No images</p>
          )}
        </div>

        {/*загрузка новых изображений */}
        <div>
          <h4>Add images</h4>

          <input
            type="file"
            multiple
            onChange={
              (e) => setNewImages(Array.from(e.target.files)) // NEW
            }
          />

          {newImages.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              {newImages.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt=""
                  style={{
                    width: "80px",
                    marginRight: "5px",
                    borderRadius: "6px",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default CardModal;
