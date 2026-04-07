import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteBoard, updateBoard } from "../../store/boardsSlice";

function BoardItem({ board }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);

  const handleUpdate = () => {
    if (!title.trim()) return;
    dispatch(updateBoard({ boardId: board.id, title }));
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        <input
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleUpdate}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUpdate();
          }}
        />
      ) : (
        <>
          {/* клик по названию - переход на страницу доски */}
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/boards/${board.id}`)}
          >
            {board.title}
          </span>
          <button onClick={() => setEditing(true)}>edit</button>
          <button onClick={() => dispatch(deleteBoard(board.id))}>
            delete
          </button>
        </>
      )}
    </div>
  );
}

export default BoardItem;
