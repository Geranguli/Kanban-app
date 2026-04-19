function Topbar({
  title,
  user,
  showLogout = false,
  onLogout,
  showBackButton = false,
  onBack,
}) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {showBackButton && (
          <>
            <button onClick={onBack} className="topbar-back">
              Назад
            </button>
            <div className="topbar-divider"></div>
          </>
        )}
        <div className="topbar-breadcrumb">
          {title && title !== "Доски" ? (
            <>
              Доски <span>/</span> <span>{title}</span>
            </>
          ) : (
            <span>Доски</span>
          )}
        </div>
      </div>
      <div className="topbar-right">
        <div className="avatar-btn">
          <div className="avatar">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="avatar-name">
            {user?.username || "Пользователь"}
          </span>
        </div>

        {showLogout && (
          <button
            onClick={onLogout}
            className="btn btn-danger btn-logout-sm ml-8"
          >
            Выйти
          </button>
        )}
      </div>
    </div>
  );
}

export default Topbar;
