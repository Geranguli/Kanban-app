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
    <div>
      <h1>Авторизация</h1>

      <input
        className="input"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          //сбрасываем ошибку при исправлении ввода
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

      <button
        onClick={handleLogin}
        disabled={loading || !username.trim()}
        className="btn btn-primary mt-16"
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span className="loading-text">Загрузка...</span>
          </>
        ) : (
          "Войти"
        )}
      </button>

      {error && (
        <div className="error mt-10" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default Auth;
