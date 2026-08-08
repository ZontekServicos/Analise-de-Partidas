import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL?.trim();

export const apiConfigurationError = apiUrl
  ? null
  : "VITE_API_URL não configurada no build do frontend.";

export const http = axios.create({
  baseURL: apiUrl
});

http.interceptors.request.use((config) => {
  if (apiConfigurationError) {
    return Promise.reject(new Error(apiConfigurationError));
  }

  return config;
});

export type ApiResponse<T> = {
  data: T;
};

export function getApiArrayData<T>(response: { data: ApiResponse<T[]> }, resource: string): T[] {
  const data = response.data?.data;

  if (!Array.isArray(data)) {
    throw new Error(`Resposta inválida da API para ${resource}.`);
  }

  return data;
}
