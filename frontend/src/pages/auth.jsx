import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, clearError } from "../store/userSlice";

function Auth() {
  const [username, setUsername] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.user);

  const handleLogin = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    try {
      await dispatch(loginUser(trimmed)).unwrap();
      // Редирект после успешного входа
      navigate("/");
    } catch (err) {
      console.error("Ошибка логина:", err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-logo-text">Авторизация</span>

        <p className="auth-subtitle">
          Введите имя пользователя для входа в систему
        </p>

        <div className="auth-field">
          <label htmlFor="username">Имя пользователя</label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) dispatch(clearError());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                handleLogin();
              }
            }}
            placeholder="Введите имя"
            disabled={loading}
            autoFocus
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !username.trim()}
          className="auth-submit"
        >
          {loading ? "Загрузка..." : "Войти"}
        </button>

        {error && (
          <div className="error-box error-box-center mt-20">{error}</div>
        )}
      </div>
    </div>
  );
}

export default Auth;
