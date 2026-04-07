import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../store/userSlice";

function Auth() {
  const [username, setUsername] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.user);

  const handleLogin = async () => {
    if (!username.trim()) return;

    const result = await dispatch(loginUser(username));

    // после успешного логина переходим на главную
    if (result.meta.requestStatus === "fulfilled") {
      navigate("/");
    }
  };

  return (
    <div>
      <h1>Авторизация</h1>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Введите имя"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleLogin();
        }}
      />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Загрузка..." : "Войти"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Auth;
