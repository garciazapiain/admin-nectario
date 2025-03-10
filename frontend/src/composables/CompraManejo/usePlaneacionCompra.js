import { ref, onMounted, onUnmounted } from "vue";
import API_URL from "../../config";

export default function usePlaneacionCompra() {
  const planeacionCompra = ref([]);
  const isLoaded = ref(false);
  let autoRefreshInterval = null; // Reference to store interval ID

  /**
   * Fetch all planeacion_compra data every time it's called
   */
  const fetchPlaneacionCompra = async () => {
    try {
      const response = await fetch(`${API_URL}/planeacion_compra`);
      if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch data`);
      planeacionCompra.value = await response.json();
      isLoaded.value = true;
    } catch (error) {
      console.error("Error fetching planeacion_compra:", error);
    }
  };

  /**
   * Start auto-refreshing the data every 30 seconds
   */
  onMounted(() => {
    fetchPlaneacionCompra(); // Initial fetch
    autoRefreshInterval = setInterval(fetchPlaneacionCompra, 30000); // Auto-refresh every 30s
  });

  /**
   * Stop auto-refresh when component is destroyed
   */
  onUnmounted(() => {
    clearInterval(autoRefreshInterval);
  });

  return {
    planeacionCompra,
    isLoaded,
    fetchPlaneacionCompra,
  };
}
