import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchColumns, createColumn } from "../store/columnsSlice";
import { fetchCards } from "../store/cardsSlice";
import { fetchBoards } from "../store/boardsSlice";

import ColumnItem from "../components/board/ColumnItem";

function Board() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { columns } = useSelector((state) => state.columns);
  const { cards, loading, error } = useSelector((state) => state.cards);
  const { boards } = useSelector((state) => state.boards);

  const board = boards.find((b) => b.id === Number(id));

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingCard, setEditingCard] = useState(null);

  // загружаем колонки при открытии доски
  useEffect(() => {
    dispatch(fetchColumns(id));
  }, [dispatch, id]);

  // загружаем карточки для каждой колонки
  useEffect(() => {
    columns.forEach((column) => {
      dispatch(fetchCards(column.id));
    });
  }, [dispatch, columns]);

  const handleCreateColumn = () => {
    if (!newColumnTitle.trim()) return;
    dispatch(createColumn({ boardId: id, title: newColumnTitle }));
    setNewColumnTitle("");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>{board ? board.title : "..."}</h1>

      <div style={{ display: "flex", gap: 20 }}>
        {columns.map((column) => (
          <ColumnItem
            key={column.id}
            column={column}
            cards={cards
              .filter((c) => c.column_id === column.id)
              .sort((a, b) => a.position - b.position)}
            onEditCard={setEditingCard}
          />
        ))}
      </div>

      <div>
        <input
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          placeholder="Column title"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateColumn();
          }}
        />
        <button onClick={handleCreateColumn}>Add column</button>
      </div>
    </div>
  );
}

export default Board;
