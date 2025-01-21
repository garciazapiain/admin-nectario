import { ref } from "vue";

export default function useErrorHandling() {
  const errorMessage = ref("");

  const setError = (message, timeout = 5000) => {
    errorMessage.value = message;
    if (timeout > 0) {
      setTimeout(() => {
        errorMessage.value = null;
      }, timeout);
    }
  };

  const clearError = () => {
    errorMessage.value = null;
  };

  return { errorMessage, setError, clearError };
}
