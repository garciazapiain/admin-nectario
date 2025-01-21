import { ref } from "vue";

export function useErrorHandler() {
  const errorMessage = ref("");

  const setError = (message) => {
    errorMessage.value = message;
  };

  const clearError = () => {
    errorMessage.value = "";
  };

  return { errorMessage, setError, clearError };
}
