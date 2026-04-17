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
import Topbar from "../styles/layout/topbar";

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { boards, loading, error, actionLoading, actionType } = useSelector(
    (state) => state.boards,
  );
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

  const isEmpty = filteredBoards.length === 0 && !loading && !error;
  const isSearching = search.length > 0;

  if (loading && boards.length === 0) {
    return (
      <div className="home-page">
        <div className="home-body">
          <div className="empty-state">
            <div className="empty-state-icon">
              <span className="spinner spinner-lg"></span>
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Topbar
        title="Мои доски"
        user={user}
        showLogout={true}
        onLogout={handleLogout}
      />

      <div className="home-body">
        {error && (
          <div className="empty-state">
            <div className="empty-state-text">{error}</div>
            <button
              onClick={() => dispatch(fetchBoards(user.id))}
              className="board-card-btn mt-10"
            >
              Повторить
            </button>
          </div>
        )}

        <div className="home-toolbar">
          <div className="search-wrapper">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            className="home-search"
            placeholder="Поиск доски..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          </div>

          {boards.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={actionLoading && actionType === "deleteAll"}
              className="board-card-btn board-card-btn-del"
            >
              {actionLoading && actionType === "deleteAll"
                ? "Удаление..."
                : "Удалить все доски"}
            </button>
          )}
        </div>

        {filteredBoards.length > 0 && (
          <div className="boards-grid">
            {filteredBoards.map((board) => (
              <BoardItem key={board.id} board={board} />
            ))}
          </div>
        )}

        {isEmpty && (
          <div className="empty-state">
            <div className="empty-state-icon">{isSearching ? (
              <i className="fa-solid fa-magnifying-glass"></i>
              ) : (
              <i className="fa-solid fa-clipboard"></i>
              )}
            </div>
            <div className="empty-state-text">
              {isSearching
                ? "Ничего не найдено"
                : "У вас пока нет досок. Создайте первую!"}
            </div>
          </div>
        )}

        <div className="create-board-row">
          <input
            className="home-search"
            style={{ backgroundImage: "none", paddingLeft: "12px" }}
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            placeholder="Название доски"
            disabled={actionLoading && actionType === "create"}
            onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
          />
          <button
            onClick={handleCreateBoard}
            disabled={
              (actionLoading && actionType === "create") ||
              !newBoardTitle.trim()
            }
            className="board-card-btn"
          >
            {actionLoading && actionType === "create" ? (
              <>
                <span className="spinner"></span>
                <span className="loading-text">Создание...</span>
              </>
            ) : (
              "Создать"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
