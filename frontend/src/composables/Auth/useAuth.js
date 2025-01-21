import { ref } from "vue";
import { useRouter } from "vue-router";
import API_URL from "../../config";
import { useErrorHandler } from "./useErrorHandler"; // Handles error messages
import { useLocalStorage } from "../shared/useLocalStorage"; // Manages localStorage

export function useAuth() {
  const router = useRouter();
  const { errorMessage, setError, clearError } = useErrorHandler();
  const { setItem } = useLocalStorage();

  const login = async (username, password) => {
    clearError(); // Reset any previous errors
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) {
          setItem("jwt", data.accessToken);
          setItem("isAdmin", data.isAdmin);
          setItem("userName", data.name);
          router.push("/"); // Redirect to home page
        } else {
          setError("Login falló"); // Login failed
        }
      } else {
        setError("Ocurrió un error"); // An error occurred
      }
    } catch (error) {
      setError("Ocurrió un error"); // An error occurred
    }
  };

  return { login, errorMessage };
}
