import { ref } from "vue";

export default function useApi(API_URL) {
  const errorMessage = ref("");

  const sendRequest = async (endpoint, method = "GET", payload = null) => {
    try {
      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (payload) options.body = JSON.stringify(payload);

      const response = await fetch(`${API_URL}${endpoint}`, options);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      return await response.json();
    } catch (error) {
      errorMessage.value = "An error occurred while processing your request.";
      console.error(error);
      return null;
    }
  };

  // Convenience methods for common request types
  const getData = async (endpoint) => await sendRequest(endpoint, "GET");
  const postData = async (endpoint, payload) => await sendRequest(endpoint, "POST", payload);
  const putData = async (endpoint, payload) => await sendRequest(endpoint, "PUT", payload);
  const deleteData = async (endpoint) => await sendRequest(endpoint, "DELETE");

  return { getData, postData, putData, deleteData, errorMessage };
}
