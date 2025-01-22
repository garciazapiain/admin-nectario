import { ref, computed } from "vue";
import API_URL from "../../config";

export default function useIngredients() {
  const ingredientes = ref([]);
  const proveedores = ref([]);
  const searchTerm = ref("");
  const selectedProveedor = ref("");
  const selectedFrecuencia = ref("");
  const selectedInsumosTipo = ref("Lista Peligro");

  const fetchIngredientes = async () => {
    try {
      const response = await fetch(`${API_URL}/ingredientes/producto-clave`);
      if (response.ok) {
        ingredientes.value = await response.json();
      } else {
        console.error("Error fetching ingredients:", response.status);
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  const fetchProveedores = async () => {
    try {
      const response = await fetch(`${API_URL}/proveedores`);
      if (response.ok) {
        const allProveedores = await response.json();
        proveedores.value = allProveedores.filter((p) => p.id !== 1);
      } else {
        console.error("Error fetching providers:", response.status);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const filteredIngredients = computed(() => {
    let result = ingredientes.value;
    if (searchTerm.value) {
      const term = searchTerm.value.toLowerCase();
      result = result.filter((ingrediente) =>
        ingrediente.nombre.toLowerCase().includes(term)
      );
    }

    if (selectedProveedor.value) {
      result = result.filter(
        (ingrediente) => ingrediente.proveedor === selectedProveedor.value
      );
    }

    result = result.filter(
      (ingrediente) =>
        !ingrediente.frecuencias_inventario.includes("no_inventarear")
    );

    if (selectedFrecuencia.value) {
      result = result.filter((ingrediente) =>
        ingrediente.frecuencias_inventario.includes(selectedFrecuencia.value)
      );
    }
    console.log(result.sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  return {
    ingredientes,
    proveedores,
    searchTerm,
    selectedProveedor,
    selectedFrecuencia,
    selectedInsumosTipo,
    fetchIngredientes,
    fetchProveedores,
    filteredIngredients,
  };
}
