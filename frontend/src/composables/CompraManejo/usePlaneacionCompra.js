import { ref } from "vue";
import API_URL from "../../config";

export default function usePlaneacionCompra() {
  const planeacionCompra = ref([]);
  const isLoaded = ref(false);

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

  return {
    planeacionCompra,
    isLoaded,
    fetchPlaneacionCompra,
  };
}
