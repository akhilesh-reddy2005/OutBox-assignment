import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;

    if (!axiosError.response) {
      return "Unable to connect to the server.";
    }

    const status = axiosError.response.status;
    const message = axiosError.response.data?.message;

    if (status === 400 && message) {
      return message;
    }

    if (status === 500) {
      return "Something went wrong. Please try again.";
    }

    if (message) {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
