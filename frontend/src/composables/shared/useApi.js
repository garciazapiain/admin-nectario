import { ref } from "vue";

export default function useApi(API_URL) {
  const errorMessage = ref("");

  const sendRequest = async (endpoint, method = "GET", payload = null, params = null) => {
    try {
      const url = new URL(`${API_URL}${endpoint}`);
      if (params) {
        Object.keys(params).forEach((key) =>
          url.searchParams.append(key, params[key])
        );
      }

      const options = {
        method,
        headers: { "Content-Type": "application/json" },
        contentType: "application/json",
      };
      if (payload) options.body = JSON.stringify(payload);

      const response = await fetch(url, options);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      return await response.json();
    } catch (error) {
      errorMessage.value = "An error occurred while processing your request.";
      console.error(error);
      return null;
    }
  };

  const getData = async (endpoint, params = null) =>
    await sendRequest(endpoint, "GET", null, params);

  const postData = async (endpoint, payload) =>
    await sendRequest(endpoint, "POST", payload);

  const putData = async (endpoint, payload) =>
    await sendRequest(endpoint, "PUT", payload);

  const deleteData = async (endpoint) =>
    await sendRequest(endpoint, "DELETE");

  return { getData, postData, putData, deleteData, errorMessage };
}
