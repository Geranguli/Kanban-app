import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.response.use(
  (response) => response, // успешно - пропускаем
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Неизвестная ошибка";

    return Promise.reject(message);
  },
);

export default api;
