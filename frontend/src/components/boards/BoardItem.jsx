import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteBoard, updateBoard } from "../../store/boardsSlice";

function BoardItem({ board }) {
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
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || (actionLoading && actionType !== "create");

  return (
    <div className="mb-16">
      {error && <div className="error-box mb-10">{error}</div>}
      {editing ? (
        <>
          <input
            className="input"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdate();
            }}
            disabled={loading}
          />

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="btn btn-primary mt-8"
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
        </>
      ) : (
        <>
          {/* клик по названию - переход на страницу доски */}
          <span
            style={{ cursor: "pointer" }}
            onClick={() => !loading && navigate(`/boards/${board.id}`)}
          >
            {board.title}
          </span>
          <button
            onClick={() => setEditing(true)}
            disabled={loading}
            className="btn btn-ghost ml-8"
          >
            edit
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-danger ml-8"
          >
            delete
          </button>
        </>
      )}
    </div>
  );
}

export default BoardItem;
