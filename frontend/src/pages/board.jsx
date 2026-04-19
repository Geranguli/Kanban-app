import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchColumns, createColumn } from "../store/columnsSlice";
import { fetchCards, moveCard, moveCardOptimistic } from "../store/cardsSlice";
import { fetchBoards } from "../store/boardsSlice";
import ColumnItem from "../components/board/ColumnItem";
import CardModal from "../components/board/CardModal";
import CardItem from "../components/board/CardItem";
import Topbar from "../styles/layout/topbar";
import { logout } from "../store/userSlice";

import {
  DndContext,
  pointerWithin,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";

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
  const [showAddColumn, setShowAddColumn] = useState(false);

  const [editingCard, setEditingCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  const [initialCards, setInitialCards] = useState([]);

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

  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) return;
    await dispatch(
      createColumn({ boardId: id, title: newColumnTitle }),
    ).unwrap();
    setNewColumnTitle("");
    setShowAddColumn(false);
  };

  const handleCancelAddColumn = () => {
    setNewColumnTitle("");
    setShowAddColumn(false);
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
    setInitialCards(cards);
  };

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;
      const activeCard = cards.find((c) => c.id === active.id);
      if (!activeCard) return;

      const overCard = cards.find((c) => c.id === over.id);
      const overData = over.data?.current;

      let targetColumnId;
      if (overCard) {
        targetColumnId = overCard.column_id;
      } else if (overData?.type === "column") {
        targetColumnId = overData.columnId;
      } else return;

      // Если карточка уже в этой колонке — не делаем лишних обновлений
      if (activeCard.column_id === targetColumnId) return;

      // перемещаем в новую колонку (в конец)
      dispatch(
        moveCardOptimistic({
          cardId: active.id,
          newColumn: targetColumnId,
          newPosition: (cardsByColumn[targetColumnId] || []).length,
        }),
      );
    },
    [cards, cardsByColumn, dispatch],
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);
    setInitialCards([]);

    //если бросили вне зоны ничего не делаем
    if (!over) return;

    const activeCard = initialCards.find((c) => c.id === active.id);
    if (!activeCard) return;

    //новая колонка и позиция
    let newColumnId;
    let newPosition;
    const overData = over.data?.current;
    const overCard = initialCards.find((c) => c.id === over.id);

    if (overCard) {
      // бросили на другую карточку - встаём перед ней
      newColumnId = overCard.column_id;

      const cardsInColumn = initialCards
        .filter((c) => c.column_id === newColumnId)
        .sort((a, b) => a.position - b.position);
      newPosition = cardsInColumn.findIndex((c) => c.id === over.id);
    } else if (overData?.type === "column") {
      // бросили на пустую колонку - встаём в конец
      newColumnId = overData.columnId;
      newPosition = initialCards.filter(
        (c) => c.column_id === newColumnId,
      ).length;
    } else {
      return;
    }

    const oldIndex = initialCards
      .filter((c) => c.column_id === activeCard.column_id)
      .sort((a, b) => a.position - b.position)
      .findIndex((c) => c.id === activeCard.id);

    if (activeCard.column_id === newColumnId && oldIndex === newPosition)
      return;

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
    <div className="board-page">
      <Topbar
        title={board?.title}
        user={user}
        showLogout={true}
        onLogout={handleLogout}
        showBackButton={true}
        onBack={handleBack}
      />
      <div className="board-content">
        {columnsLoading ? (
          <div className="page-loading">
            <span className="spinner spinner-lg"></span>
          </div>
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
              //collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="columns-wrap">
                {columns.map((column) => (
                  <ColumnItem
                    key={column.id}
                    column={column}
                    cards={cardsByColumn[column.id] || []}
                    onEditCard={setEditingCard}
                  />
                ))}
                {showAddColumn ? (
                  <div className="add-column-wrap">
                    <div className="add-column-form">
                      <input
                        placeholder="Название колонки..."
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateColumn();
                        }}
                        autoFocus
                      />
                      <div className="card-form-actions">
                        <button
                          onClick={handleCreateColumn}
                          disabled={columnsLoading}
                          className="btn btn-primary"
                        >
                          {columnsLoading ? (
                            <>
                              <span className="spinner"></span>
                              <span className="loading-text">Создание...</span>
                            </>
                          ) : (
                            "Добавить"
                          )}
                        </button>
                        <button
                          onClick={handleCancelAddColumn}
                          className="btn btn-ghost"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddColumn(true)}
                    className="add-column-trigger"
                  >
                    + Добавить колонку
                  </button>
                )}
              </div>

              <DragOverlay>
                {activeCard ? (
                  <div className="card-preview">
                    <CardItem card={activeCard} onEdit={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <CardModal
              card={editingCard}
              onClose={() => setEditingCard(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}
export default Board;
