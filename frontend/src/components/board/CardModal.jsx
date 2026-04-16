import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateCard,
  uploadImages,
  deleteImage,
  clearError,
} from "../../store/cardsSlice";

function CardModal({ card, onClose }) {
  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.cards);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [newImages, setNewImages] = useState([]);
  const [localImages, setLocalImages] = useState([]);
  const [localError, setLocalError] = useState(null);

  // заполняем форму данными карточки при открытии
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || "",
        description: card.description || "",
        due_date: card.due_date || "",
      });
      setLocalImages(card.images || []);
      setNewImages([]);
      setLocalError(null);

      dispatch(clearError());
    }
  }, [card, dispatch]);

  const handleClose = () => {
    setLocalError(null);
    dispatch(clearError());
    onClose();
  };

  const handleSave = async () => {
    setLocalError(null);
    try {
      // ждём завершения update
      await dispatch(
        updateCard({
          cardId: card.id,
          data: {
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date || null,
          },
        }),
      ).unwrap();

      // если есть новые картинки — загружаем
      if (newImages.length > 0) {
        await dispatch(
          uploadImages({
            cardId: card.id,
            files: newImages,
          }),
        ).unwrap();
      }

      handleClose();
    } catch (err) {
      setLocalError(err || "Ошибка сохранения");
    }
  };
  const handleDeleteImage = async (id) => {
    const prev = [...localImages];

    setLocalImages((imgs) => imgs.filter((i) => i.id !== id)); // сразу удаляем
    try {
      await dispatch(deleteImage(id)).unwrap();
    } catch {
      setLocalImages(prev); // откат
      setLocalError("Ошибка удаления");
    }
  };
  // не рендерим модалку если карточка не выбрана
  if (!card) return null;

  return (
    // клик по фону закрывает модалку
    <div onClick={onClose} className="modal-overlay">
      {/* клик внутри окна не закрывает его */}
      <div onClick={(e) => e.stopPropagation()} className="modal">
        <h3>Edit card</h3>

        {/* Показываем ошибку */}
        {(localError || error) && (
          <div className="error-box mb-10">{localError || error}</div>
        )}

        <input
          className="input"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Title"
          disabled={loading}
        />

        <textarea
          className="input"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Description"
          disabled={loading}
        />

        <input
          className="input"
          type="date"
          value={formData.due_date || ""}
          onChange={(e) =>
            setFormData({ ...formData, due_date: e.target.value })
          }
          disabled={loading}
        />

        <div>
          <h4>Images</h4>

          {localImages.length > 0 ? (
            localImages.map((img) => (
              <div key={img.id} className="mt-8">
                <img src={`http://localhost:8000/${img.url}`} width="100" />
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="btn btn-danger mt-8"
                >
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
            className="input"
            type="file"
            multiple
            onChange={(e) => setNewImages(Array.from(e.target.files))}
            disabled={loading}
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

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary mt-16"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              <span className="loading-text">Сохранение...</span>
            </>
          ) : (
            "Save"
          )}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="btn btn-ghost mt-16 ml-8"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default CardModal;
