/**
 * Модальное окно редактирования карточки
 *
 * Поддерживает:
 * - Редактирование title, description, due_date
 * - Загрузку/удаление изображений
 * - Просмотра изображений в полном размере
 * - Скачивание изображений через Blob-URL
 *
 * formData отделен от Redux до нажатия "Сохранить"
 */

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

  // Глобальные состояния загрузки и ошибок из Redux
  const { loading, error } = useSelector((state) => state.cards);

  // Локальный стейт формы (не синхронизируем с Redux до сохранения)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [localImages, setLocalImages] = useState([]);
  const [localError, setLocalError] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Синхронизация с пропсом card при открытии карточки
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || "",
        description: card.description || "",
        due_date: card.due_date || "",
      });
      setLocalImages(card.images || []);
      setLocalError(null);
      dispatch(clearError()); // Сбрасываем глобальную ошибку при открытии
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
      // Отправляем только измененные поля
      await dispatch(
        updateCard({
          cardId: card.id,
          data: {
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date || null, // Пустая строка -> null для БД
          },
        }),
      ).unwrap();

      handleClose();
    } catch (err) {
      setLocalError(err || "Ошибка сохранения");
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLocalError(null);

    try {
      // uploadImages возвращает обновленную карточку с новыми изображениями
      const updatedCard = await dispatch(
        uploadImages({
          cardId: card.id,
          files,
        }),
      ).unwrap();

      setLocalImages(updatedCard.images || []);
      e.target.value = ""; // сброс input для повторной загрузки того же файла
    } catch (err) {
      setLocalError(err || "Ошибка загрузки");
    }
  };

  const handleDeleteImage = async (e, id) => {
    e.stopPropagation();
    const prev = [...localImages]; // сохраняем для отката

    // убираем из UI сразу
    setLocalImages((imgs) => imgs.filter((i) => i.id !== id));

    try {
      await dispatch(deleteImage(id)).unwrap();
    } catch {
      // откат при ошибке API
      setLocalImages(prev);
      setLocalError("Ошибка удаления");
    }
  };

  // скачивание через создание Blob-URL
  const handleDownload = async () => {
    if (!lightboxImg) return;
    try {
      const response = await fetch(lightboxImg.src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = lightboxImg.url.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl); // Освобождаем память
    } catch {
      setLocalError("Ошибка скачивания");
    }
  };

  // Не рендерим модалку, если карточка не выбрана
  if (!card) return null;

  return (
    // клик по фону закрывает модалку
    <div
      className="modal-overlay"
      onClick={() => {
        if (!loading) handleClose();
      }}
    >
      {/* клик внутри окна не закрывает его */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={handleClose}
          disabled={loading}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Показываем ошибку */}
        {(localError || error) && (
          <div className="error-box mt-20">{localError || error}</div>
        )}
        <div className="modal-fields">
          <div className="modal-field">
            <input
              className="input"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Название"
              disabled={loading}
            />

            <textarea
              className="input"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Описание"
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
          </div>
        </div>
        <div className="modal-field">
          <h4 className="modal-section-title">Вложения</h4>

          {localImages.length == 0 ? (
            <p className="modal-noImg">Нет изображений</p>
          ) : (
            <div className="modal-images">
              {localImages.map((img) => (
                <div key={img.id} className="modal-img-row">
                  <div
                    className="modal-img-wrap"
                    onClick={() =>
                      setLightboxImg({
                        src: `http://localhost:8000/${img.url}`,
                        url: img.url,
                        id: img.id,
                      })
                    }
                  >
                    <img src={`http://localhost:8000/${img.url}`} alt="" />
                  </div>

                  <button
                    className="modal-img-delete"
                    onClick={(e) => handleDeleteImage(e, img.id)}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-field">
          <h4 className="modal-section-title">Добавить</h4>
          <input
            className="input"
            type="file"
            multiple
            onChange={handleUpload}
            disabled={loading}
          />
        </div>

        <div className="modal-footer">
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
              "Сохранить"
            )}
          </button>
        </div>
      </div>

      {lightboxImg && (
        <div
          className="lightbox-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxImg(null);
          }}
        >
          <button
            className="lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImg(null);
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxImg.src} alt="" />
            <div className="lightbox-actions">
              <button className="lightbox-btn" onClick={handleDownload}>
                <i className="fa-solid fa-download"></i> Скачать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardModal;
