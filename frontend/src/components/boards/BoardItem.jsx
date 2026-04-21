import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteBoard, updateBoard } from "../../store/boardsSlice";

function BoardItem({ board, accentClass }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { actionLoading, actionType } = useSelector((state) => state.boards);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdate = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await dispatch(updateBoard({ boardId: board.id, title })).unwrap();
      setEditing(false);
    } catch (err) {
      setError(err || "Ошибка обновления доски");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Удалить доску?");
    if (!confirmDelete) return;

    setIsLoading(true);
    setError(null);
    try {
      await dispatch(deleteBoard(board.id)).unwrap();
    } catch (err) {
      setError(err || "Ошибка удаления доски");
    } finally {
      setIsLoading(false);
    }
  };

  const loading =
    isLoading ||
    (actionLoading && (actionType === "delete" || actionType === "update"));

  return (
    <div
      className="board-card"
      onClick={() => !loading && !editing && navigate(`/boards/${board.id}`)}
    >
      <div className={`board-card-accent ${accentClass}`} />
      <div className="board-card-body">
        {editing ? (
          <>
            <input
              className="input mb-8"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate();
              }}
              disabled={loading}
            />

            <div className="board-card-actions">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="board-card-btn"
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

              <button
                onClick={(e) => {
                  setEditing(false);
                  e.stopPropagation();
                }}
                disabled={loading}
                className="board-card-btn board-card-btn-del"
              >
                Отмена
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="board-card-name">{board.title}</div>

            <div className="board-card-actions">
              <button
                onClick={(e) => {
                  setTitle(board.title);
                  setEditing(true);
                  e.stopPropagation();
                }}
                disabled={loading}
                className="board-card-btn board-card-btn-lg"
              >
                Изменить
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={loading}
                className="board-card-btn board-card-btn-del board-card-btn-lg"
              >
                Удалить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BoardItem;
