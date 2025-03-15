import { ref } from "vue";
import API_URL from "../../config";

const proveedoresCache = ref([]); // Cache to avoid duplicate API calls
const isLoaded = ref(false);

export default function useProveedores() {
  const fetchProveedores = async () => {
    if (isLoaded.value) return proveedoresCache.value; // Return cached data if already loaded

    try {
      const response = await fetch(`${API_URL}/proveedores`);
      if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch proveedores`);

      let proveedores = await response.json();
      proveedores = proveedores.filter((proveedor) => proveedor.id !== 1); // Filter as needed

      // Prioritize "Transferir Moral a Campestre" and "Transferir Campestre a Moral"
      const priorityProveedores = proveedores.filter(proveedor => 
        proveedor.nombre === "Transferir Moral a Campestre" || 
        proveedor.nombre === "Transferir Campestre a Moral"
      );
      const otherProveedores = proveedores.filter(proveedor => 
        proveedor.nombre !== "Transferir Moral a Campestre" && 
        proveedor.nombre !== "Transferir Campestre a Moral"
      );

      proveedoresCache.value = [...priorityProveedores, ...otherProveedores];
      isLoaded.value = true;
    } catch (error) {
      console.error("Error fetching proveedores:", error);
    }

    return proveedoresCache.value;
  };

  return { proveedores: proveedoresCache, fetchProveedores, isLoaded };
}
