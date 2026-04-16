import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteBoard, updateBoard } from "../../store/boardsSlice";

function BoardItem({ board }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  return (
    <div className="mb-16">
      {error && <div className="error mb-10">{error}</div>}
      {editing ? (
        <>
          <input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdate();
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="btn btn-primary mt-8"
          >
            {isLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </>
      ) : (
        <>
          {/* клик по названию - переход на страницу доски */}
          <span
            style={{ cursor: "pointer" }}
            onClick={() => !isLoading && navigate(`/boards/${board.id}`)}
          >
            {board.title}
          </span>
          <button
            onClick={() => setEditing(true)}
            disabled={isLoading}
            className="btn btn-ghost ml-8"
          >
            edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
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
