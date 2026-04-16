import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBoards,
  createBoard,
  deleteAllBoards,
} from "../store/boardsSlice";
import BoardItem from "../components/boards/BoardItem";
import { logout } from "../store/userSlice";

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { boards, loading, error } = useSelector((state) => state.boards);
  const { user } = useSelector((state) => state.user);
  const [search, setSearch] = useState("");

  const [newBoardTitle, setNewBoardTitle] = useState("");

  useEffect(() => {
    // если не авторизован - редиректим на логин
    if (!user) {
      navigate("/login");
      return;
    }
    dispatch(fetchBoards(user.id));
  }, [dispatch, user, navigate]);

  const handleCreateBoard = () => {
    if (!newBoardTitle.trim()) {
      return;
    }
    dispatch(createBoard({ title: newBoardTitle, userId: user.id }));
    setNewBoardTitle("");
  };

  const handleDeleteAll = () => {
    if (!user) return;

    const confirmDelete = window.confirm("Удалить все доски?");
    if (!confirmDelete) return;

    dispatch(deleteAllBoards(user.id));
  };
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };
  const filteredBoards = boards.filter((board) =>
    board.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <h2>Доски</h2>

      <button onClick={handleLogout} className="btn btn-ghost mb-16">
        Выйти
      </button>

      {error && (
        <div
          className="error mb-16"
          style={{
            background: "#fee2e2",
            padding: "10px",
          }}
        >
          <div className="error">{error}</div>
          {/*<p style={{ color: "#dc2626" }}>{error}</p>*/}
          <button
            onClick={() => dispatch(fetchBoards(user.id))}
            className="btn btn-primary mt-8"
          >
            Повторить
          </button>
        </div>
      )}

      <div className="mb-16">
        {/* поиск */}
        <input
          placeholder="Поиск доски..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/*удалить все */}
        <button onClick={handleDeleteAll} className="btn btn-danger ml-8">
          Удалить все доски
        </button>
      </div>

      {filteredBoards.map((board) => (
        <BoardItem key={board.id} board={board} />
      ))}

      <div className="mt-20">
        <input
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          placeholder="Название доски"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateBoard();
          }}
        />
        <button
          onClick={handleCreateBoard}
          disabled={loading}
          className="btn btn-primary mt-10"
        >
          {loading ? "Создание..." : "Создать"}
        </button>
      </div>
    </div>
  );
}

export default Home;
