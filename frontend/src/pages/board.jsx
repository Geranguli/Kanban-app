import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchColumns, createColumn } from "../store/columnsSlice";
import { fetchCards, moveCard } from "../store/cardsSlice";
import { fetchBoards } from "../store/boardsSlice";

import ColumnItem from "../components/board/ColumnItem";
import CardModal from "../components/board/CardModal";

import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";

function Board() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { columns } = useSelector((state) => state.columns);
  const { cards, loading, error } = useSelector((state) => state.cards);
  const { boards } = useSelector((state) => state.boards);

  const board = boards.find((b) => b.id === Number(id));

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingCard, setEditingCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

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

  // запоминаем карточку которую начали тащить
  const handleDragStart = (event) => {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    let newColumnId;
    let newPosition;

    const overData = over.data?.current;
    const overCard = cards.find((c) => c.id === over.id);

    if (overCard) {
      // бросили на другую карточку - встаём перед ней
      newColumnId = overCard.column_id;
      const cardsInColumn = cards
        .filter((c) => c.column_id === newColumnId)
        .sort((a, b) => a.position - b.position);
      newPosition = cardsInColumn.findIndex((c) => c.id === over.id);
    } else if (overData?.type === "column") {
      // бросили на пустую колонку - встаём в конец
      newColumnId = Number(over.id);
      const cardsInColumn = cards
        .filter((c) => c.column_id === newColumnId)
        .sort((a, b) => a.position - b.position);
      newPosition = cardsInColumn.length;
    } else {
      return;
    }
    //if (!newColumnId && newColumnId !== 0) return;

    try {
      await dispatch(
        moveCard({
          cardId: active.id,
          newColumn: newColumnId,
          newPosition,
        }),
      );

      // обновляем новую колонку
      dispatch(fetchCards(newColumnId));

      if (activeCard.column_id !== newColumnId) {
        dispatch(fetchCards(activeCard.column_id));
      }
    } catch (e) {
      console.error("Ошибка перемещения:", e);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>{board ? board.title : "..."}</h1>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board">
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

        {/* показываем карточку под курсором во время перетаскивания */}
        <DragOverlay>
          {activeCard ? <div className="card">{activeCard.title}</div> : null}
        </DragOverlay>
      </DndContext>

      <div className="form">
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

      <CardModal card={editingCard} onClose={() => setEditingCard(null)} />
    </div>
  );
}

export default Board;
