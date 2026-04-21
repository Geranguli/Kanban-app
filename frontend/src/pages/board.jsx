import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchColumns, createColumn } from "../store/columnsSlice";
import {
  fetchBoardCards,
  moveCard,
  moveCardOptimistic,
} from "../store/cardsSlice";
import { fetchBoards } from "../store/boardsSlice";
import ColumnItem from "../components/board/ColumnItem";
import CardModal from "../components/board/CardModal";
import CardItem from "../components/board/CardItem";
import Topbar from "../styles/layout/topbar";
import { logout } from "../store/userSlice";

import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
} from "@dnd-kit/core";

function Board() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { columns, loading: columnsLoading } = useSelector(
    (state) => state.columns,
  );
  const { cards } = useSelector((state) => state.cards);
  const { boards } = useSelector((state) => state.boards);
  const { user } = useSelector((state) => state.user);

  const board = boards.find((b) => b.id === Number(id));

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [columnError, setColumnError] = useState(null);

  const cardsByColumn = useMemo(() => {
    const map = {};

    columns.forEach((col) => {
      map[col.id] = [];
    });

    cards.forEach((card) => {
      if (map[card.column_id] !== undefined) {
        map[card.column_id].push(card);
      }
    });

    Object.values(map).forEach((arr) => {
      arr.sort((a, b) => a.position - b.position);
    });

    return map;
  }, [cards, columns]);

  const loadColumns = useCallback(() => {
    if (id) {
      dispatch(fetchColumns(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    loadColumns();
  }, [loadColumns]);

  useEffect(() => {
    if (id) {
      dispatch(fetchBoardCards(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (user && boards.length === 0) {
      dispatch(fetchBoards(user.id));
    }
  }, [dispatch, user, boards.length]);

  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) return;

    setColumnError(null);
    try {
      await dispatch(
        createColumn({ boardId: id, title: newColumnTitle }),
      ).unwrap();
      setNewColumnTitle("");
      setShowAddColumn(false);
    } catch (err) {
      setColumnError(err?.message || "Ошибка создания колонки");
    }
  };

  const handleCancelAddColumn = () => {
    setNewColumnTitle("");
    setShowAddColumn(false);
    setColumnError(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleDragStart = (event) => {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    const overId = over.id;
    const overData = over.data?.current;

    let newColumnId;
    let newPosition;

    // Определяем, бросили на колонку/пустую зону или на карточку
    if (overData?.type === "column" || overData?.type === "empty-zone") {
      // Бросили на колонку или пустую зону внутри колонки
      newColumnId = overData.columnId;

      // Получаем карточки целевой колонки (уже отсортированные)
      const cardsInColumn = cards
        .filter((c) => c.column_id === newColumnId)
        .sort((a, b) => a.position - b.position);

      // Если колонка пустая — позиция 0, иначе в конец
      newPosition = cardsInColumn.length;
    } else {
      // Бросили на карточку
      const overCard = cards.find((c) => c.id === overId);
      if (!overCard) return;

      newColumnId = overCard.column_id;

      const cardsInColumn = cards
        .filter((c) => c.column_id === newColumnId)
        .sort((a, b) => a.position - b.position);

      const overIndex = cardsInColumn.findIndex((c) => c.id === overId);

      // Определяем, перед или после карточки, по положению указателя/центра
      const activeRect = active.rect.current.translated;
      const overRect = over.rect;

      if (!activeRect || !overRect) {
        newPosition = overIndex;
      } else {
        // Если центр перетаскиваемой карточки выше центра целевой - вставляем перед
        const activeCenterY = activeRect.top + activeRect.height / 2;
        const overCenterY = overRect.top + overRect.height / 2;
        const isBefore = activeCenterY < overCenterY;

        // Корректировка для перемещения внутри одной колонки
        if (activeCard.column_id === newColumnId) {
          const activeIndex = cardsInColumn.findIndex(
            (c) => c.id === active.id,
          );

          if (activeIndex < overIndex && isBefore) {
            // Двигаем вверх, но уже выше целевой — остаёмся перед ней
            newPosition = overIndex - 1;
          } else if (activeIndex > overIndex && !isBefore) {
            // Двигаем вниз, но уже ниже целевой — остаёмся после неё
            newPosition = overIndex + 1;
          } else {
            newPosition = isBefore ? overIndex : overIndex + 1;
          }
        } else {
          // Из другой колонки — просто перед или после
          newPosition = isBefore ? overIndex : overIndex + 1;
        }
      }
    }

    // Ограничиваем позицию
    const cardsInTargetColumn = cards.filter(
      (c) => c.column_id === newColumnId,
    );
    if (newPosition > cardsInTargetColumn.length) {
      newPosition = cardsInTargetColumn.length;
    }
    if (newPosition < 0) {
      newPosition = 0;
    }

    // Если ничего не изменилось — не делаем запрос
    if (
      activeCard.column_id === newColumnId &&
      activeCard.position === newPosition
    ) {
      return;
    }

    // Оптимистичное обновление
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
      console.error("Ошибка перемещения:", e);
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

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
        {columnsLoading && (
          <div className="overlay-spinner">
            <span className="spinner spinner-lg"></span>
          </div>
        )}

        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
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

                  {columnError && (
                    <div className="error-box mt-8">
                      <p>{columnError}</p>
                    </div>
                  )}
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
                      onClick={(e) => {
                        if (!columnsLoading) handleCancelAddColumn();
                      }}
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

          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard ? (
              <div className="card-preview">
                <CardItem card={activeCard} onEdit={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <CardModal card={editingCard} onClose={() => setEditingCard(null)} />
      </div>
    </div>
  );
}

export default Board;
