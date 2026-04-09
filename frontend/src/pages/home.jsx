import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBoards, createBoard } from "../store/boardsSlice";
import BoardItem from "../components/boards/BoardItem";
import { logout } from "../store/userSlice";

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { boards, loading, error } = useSelector((state) => state.boards);
  const { user } = useSelector((state) => state.user);

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

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <h2>Доски</h2>

      <button onClick={handleLogout}>Выйти</button>

      {boards.map((board) => (
        <BoardItem key={board.id} board={board} />
      ))}

      <div>
        <input
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          placeholder="Название доски"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateBoard();
          }}
        />
        <button onClick={handleCreateBoard}>Создать</button>
      </div>
    </div>
  );
}

export default Home;
