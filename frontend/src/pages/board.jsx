import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchColumns, createColumn } from "../store/columnsSlice";
import { fetchCards, moveCard, moveCardOptimistic } from "../store/cardsSlice";
import { fetchBoards } from "../store/boardsSlice";
import ColumnItem from "../components/board/ColumnItem";
import CardModal from "../components/board/CardModal";
import Topbar from "../styles/layout/topbar";
import { logout } from "../store/userSlice";

import { DndContext, pointerWithin, DragOverlay } from "@dnd-kit/core";

function Board() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const navigate = useNavigate();

  //разделяем состояния карточек и колонок
  const {
    columns,
    loading: columnsLoading,
    error: columnsError,
  } = useSelector((state) => state.columns);
  const { cards, loading: cardsLoading } = useSelector((state) => state.cards);
  const { boards } = useSelector((state) => state.boards);
  const { user } = useSelector((state) => state.user);

  const board = boards.find((b) => b.id === Number(id));

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [editingCard, setEditingCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  //группируем карточки по колонкам и сортируем
  const cardsByColumn = useMemo(() => {
    const map = {};

    cards.forEach((card) => {
      if (!map[card.column_id]) {
        map[card.column_id] = [];
      }
      map[card.column_id].push(card);
    });

    //сортируем один раз
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.position - b.position),
    );

    return map;
  }, [cards]);

  //загрузка колонок
  const loadColumns = useCallback(() => {
    if (id) {
      dispatch(fetchColumns(id));
    }
  }, [dispatch, id]);

  // загружаем колонки при открытии доски
  useEffect(() => {
    loadColumns();
  }, [loadColumns]);

  // загружаем карточки для каждой колонки
  useEffect(() => {
    columns.forEach((column) => {
      dispatch(fetchCards(column.id));
    });
  }, [dispatch, columns]);

  //доски подгружаются после перезагрузки
  useEffect(() => {
    if (user && boards.length === 0) {
      dispatch(fetchBoards(user.id));
    }
  }, [dispatch, user, boards.length]);

  const handleCreateColumn = () => {
    if (!newColumnTitle.trim()) return;
    dispatch(createColumn({ boardId: id, title: newColumnTitle }));
    setNewColumnTitle("");
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/");
  };

  // запоминаем карточку которую начали тащить
  const handleDragStart = (event) => {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card); //сохраняем карточку для dragoverlay
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    //если бросили вне зоны ничего не делаем
    if (!over) return;

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    //новая колонка и позиция
    let newColumnId;
    let newPosition;
    const overData = over.data?.current;
    const overCard = cards.find((c) => c.id === over.id);

    if (overCard) {
      // бросили на другую карточку - встаём перед ней
      newColumnId = overCard.column_id;

      const cardsInColumn = cardsByColumn[newColumnId] || [];
      const overIndex = cardsInColumn.findIndex((c) => c.id === over.id);

      newPosition = overIndex;
    } else if (overData?.type === "column") {
      // бросили на пустую колонку - встаём в конец
      newColumnId = overData.columnId;
      const cardsInColumn = cardsByColumn[newColumnId] || [];
      newPosition = cardsInColumn.length;
    } else {
      return;
    }

    const oldIndex = (cardsByColumn[activeCard.column_id] || []).findIndex(
      (c) => c.id === activeCard.id,
    );

    //ничего не изменилось - ничего не делаем
    if (activeCard.column_id === newColumnId && oldIndex === newPosition) {
      return;
    }
    //новое обновление
    dispatch(
      moveCardOptimistic({
        cardId: active.id,
        newColumn: newColumnId,
        newPosition,
      }),
    );

    try {
      await dispatch(
        moveCard({
          cardId: active.id,
          newColumn: newColumnId,
          newPosition,
        }),
      ).unwrap();
    } catch (e) {
      //при ошибке откатываем изменения через перезагрузку карточек
      console.error("Ошибка перемещения:", e);

      dispatch(fetchCards(activeCard.column_id));
      dispatch(fetchCards(newColumnId));
    }
  };

  if (columnsLoading) return <div>Загрузка...</div>;

  return (
    <div>
      <Topbar
        title={board?.title}
        user={user}
        showLogout={true}
        onLogout={handleLogout}
        showBackButton={true}
        onBack={handleBack}
      />
      <div style={{ padding: "24px" }}>
        {columnsLoading ? (
          <div className="page-loading">Загрузка...</div>
        ) : (
          <>
            {columnsError && (
              <div className="error-box mb-16">
                <div>{columnsError}</div>
                <button onClick={loadColumns} className="btn btn-primary mt-8">
                  Повторить
                </button>
              </div>
            )}

            {cardsLoading && (
              <div className="loading-text mb-10">Загрузка карточек...</div>
            )}

            <DndContext
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="board">
                {columns.map((column) => (
                  <ColumnItem
                    key={column.id}
                    column={column}
                    cards={cardsByColumn[column.id] || []}
                    onEditCard={setEditingCard}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeCard ? (
                  <div className="card dragging-preview">
                    {activeCard.title}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <div className="form mt-20">
              <input
                className="input"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Column title"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateColumn();
                }}
              />
              <button
                onClick={handleCreateColumn}
                disabled={columnsLoading}
                className="btn btn-primary mt-10"
              >
                {columnsLoading ? (
                  <>
                    <span className="spinner"></span>
                    <span className="loading-text">Создание...</span>
                  </>
                ) : (
                  "Создать колонку"
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <CardModal card={editingCard} onClose={() => setEditingCard(null)} />
    </div>
  );
}

export default Board;
