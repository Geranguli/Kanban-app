/**
 * Экземпляр axios для API-запросов
 *
 * - Успешные ответы пропускаются как есть
 * - Сетевые ошибки (нет ответа от сервера) -> "Нет соединения с сервером"
 * - Ошибки с ответом сервера -> извлекаем message из тела ответа
 */

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.response.use(
  (response) => response, // успешно - пропускаем
  (error) => {
    if (!error.response) {
      // Ошибка сети: сервер недоступен, CORS, таймаут
      return Promise.reject("Нет соединения с сервером");
    }

    const message = error.response?.data?.message || "Ошибка сервера";

    return Promise.reject(message);
  },
);

export default api;
