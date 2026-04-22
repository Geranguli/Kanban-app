/**
 * Главная страница со списком досок пользователя
 *
 * Функционал:
 * - Загрузка досок при авторизации (редирект на /login)
 * - Поиск по названию
 * - Создание новой доски (inline-форма)
 * - Удаление всех досок с подтверждением
 * - Выход из системы (очистка localStorage и Redux)
 */

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
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // если не авторизован - редиректим на логин
    if (!user) {
      navigate("/login");
      return;
    }
    dispatch(fetchBoards(user.id));
  }, [dispatch, user, navigate]);

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      await dispatch(
        createBoard({ title: newBoardTitle, userId: user.id }),
      ).unwrap();
      setIsCreating(false);
      setNewBoardTitle("");
    } catch (err) {
      console.error("Ошибка создания:", err);
    }
  };

  const handleDeleteAll = () => {
    if (!user) return;

    const confirmDelete = window.confirm("Удалить все доски?");
    if (!confirmDelete) return;

    dispatch(deleteAllBoards(user.id));
  };
  const handleLogout = () => {
    dispatch(logout()); // Очищает localStorage и Redux-стейт
    navigate("/login");
  };
  const filteredBoards = boards.filter((board) =>
    board.title.toLowerCase().includes(search.toLowerCase()),
  );

  const isSearching = search.length > 0;
  const hasBoards = filteredBoards.length > 0;

  // Состояние загрузки при первом входе
  if (loading && boards.length === 0) {
    return (
      <div className="home-page">
        <Topbar
          title="Доски"
          user={user}
          showLogout={true}
          onLogout={handleLogout}
        />
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
        title="Доски"
        user={user}
        showLogout={true}
        onLogout={handleLogout}
      />

      <div className="home-body">
        {error && (
          <div className="empty-state mb-16">
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

          {filteredBoards.length > 0 && (
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

        <div className="boards-grid">
          {filteredBoards.map((board, idx) => (
            <BoardItem
              key={board.id}
              board={board}
              accentClass={`accent-${idx % 10}`}
            />
          ))}

          {isCreating ? (
            <div className="board-card" onClick={(e) => e.stopPropagation()}>
              <div className="board-card-accent accent-0" />
              <div className="board-card-body">
                <input
                  autoFocus
                  className="input mb-8"
                  placeholder="Название доски..."
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateBoard();
                    }
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewBoardTitle("");
                    }
                  }}
                />
                <div className="board-card-actions">
                  <button
                    onClick={() => {
                      handleCreateBoard();
                    }}
                    disabled={
                      !newBoardTitle.trim() ||
                      (actionLoading && actionType === "create")
                    }
                    className="board-card-btn"
                  >
                    {actionLoading && actionType === "create" ? (
                      <>
                        <span className="spinner"></span>
                        <span>создание...</span>
                      </>
                    ) : (
                      "Создать"
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewBoardTitle("");
                    }}
                    disabled={actionLoading && actionType === "create"}
                    className="board-card-btn board-card-btn-del"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="board-card board-card-new"
              onClick={() => setIsCreating(true)}
            >
              <div className="board-card-new-icon">+</div>
              <span className="board-card-new-label">Новая доска</span>
            </div>
          )}
        </div>

        {!hasBoards && !error && !loading && (
          <div className="empty-state mt-20">
            <div className="empty-state-icon">
              {isSearching ? (
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
      </div>
    </div>
  );
}

export default Home;
