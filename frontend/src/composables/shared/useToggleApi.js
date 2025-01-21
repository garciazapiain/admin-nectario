// src/composables/shared/useToggleApi.js
import { ref } from "vue";

export default function useToggleApi(API_URL) {
  const isLoading = ref(false);

  const toggleApiState = async (url, payload, updateLocalState) => {
    try {
      isLoading.value = true;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: Failed to update state`);

      // Call the function to update the local state
      if (updateLocalState) updateLocalState();
    } catch (error) {
      console.error("Error toggling API state:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    toggleApiState,
  };
}
