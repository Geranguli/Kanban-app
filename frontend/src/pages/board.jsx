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
  pointerWithin,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";

function Board() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  const cardsByColumn = useMemo(() => {
    const map = {};

    // Инициализируем все колонки пустыми массивами
    columns.forEach((col) => {
      map[col.id] = [];
    });

    // Распределяем карточки
    cards.forEach((card) => {
      if (map[card.column_id] !== undefined) {
        map[card.column_id].push(card);
      }
    });

    // Сортируем внутри каждой колонки
    Object.values(map).forEach((arr) => {
      arr.sort((a, b) => a.position - b.position);
    });

    return map;
  }, [cards, columns]); // columns добавлен для инициализации пустых массивов

  // 1 запрос на загрузку колонок
  const loadColumns = useCallback(() => {
    if (id) {
      dispatch(fetchColumns(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    loadColumns();
  }, [loadColumns]);

  // 1 запрос на все карточки доски
  useEffect(() => {
    if (id) {
      dispatch(fetchBoardCards(id));
    }
  }, [dispatch, id]);

  // Доски подгружаются после перезагрузки
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

    // Определяем целевую колонку
    const overCard = cards.find((c) => c.id === over.id);
    const overData = over.data?.current;

    let newColumnId;
    let isOverColumn = false;

    if (overCard) {
      newColumnId = overCard.column_id;
    } else if (overData?.type === "column") {
      newColumnId = overData.columnId;
      isOverColumn = true;
    } else return;

    // Позиция в целевой колонке
    const cardsInColumn = cards
      .filter((c) => c.column_id === newColumnId)
      .sort((a, b) => a.position - b.position);
    let newPosition;

    if (isOverColumn) {
      // Бросили прямо на колонку — в конец
      newPosition = cardsInColumn.length;
    } else if (overCard) {
      // определяем, перед или после карточки
      const overIndex = cardsInColumn.findIndex((c) => c.id === over.id);

      // Получаем координаты для сравнения
      const activeRect = active.rect.current.translated;
      const overRect = over.rect;

      if (!activeRect || !overRect) {
        newPosition = overIndex;
      } else {
        // Если бросили ниже центра over-карточки — после неё
        const isAfter = activeRect.top > overRect.top + overRect.height / 2;

        newPosition = isAfter ? overIndex + 1 : overIndex;
      }
    } else {
      newPosition = cardsInColumn.length;
    }

    // Ограничиваем
    if (newPosition > cardsInColumn.length) {
      newPosition = cardsInColumn.length;
    }
    if (newPosition < 0) {
      newPosition = 0;
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

  if (columnsLoading && columns.length === 0) {
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

            {cardsLoading && cards.length === 0 && (
              <div className="loading-text mb-10">Загрузка карточек...</div>
            )}

            <DndContext
              //collisionDetection={pointerWithin}
              collisionDetection={closestCenter}
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
