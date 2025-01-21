import { computed } from "vue";

export default function useFilters(ingredientes, searchTerm, selectedProveedor, selectedFrecuencia, selectedInsumosTipo) {
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

    if (selectedInsumosTipo.value === "Lista Peligro") {
      result = result.filter((ingrediente) => ingrediente.producto_clave);
    }

    return result;
  });

  return { filteredIngredients };
}
