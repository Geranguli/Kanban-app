import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.response.use(
  (response) => response, // успешно - пропускаем
  (error) => {
    if (!error.response) {
      return Promise.reject("Нет соединения с сервером");
    }

    const message = error.response?.data?.message || "Ошибка сервера";

    return Promise.reject(message);
  },
);

export default api;
