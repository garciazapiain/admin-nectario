import useToggleApi from "../shared/useToggleApi";

export default function usePlaneacionActions(API_URL) {
  const { toggleApiState } = useToggleApi(API_URL);

  const toggleYaComprado = (ingrediente) => {
    const newValue = !ingrediente.ya_comprado;
    toggleApiState(
      `${API_URL}/planeacion_compra/${ingrediente.id_ingrediente}/toggle-comprado`,
      { ya_comprado: newValue },
      () => (ingrediente.ya_comprado = newValue) // Update locally
    );
  };

  const toggleEntregado = (ingrediente, store) => {
    const column = store === "moral" ? "ya_entregado_moral" : "ya_entregado_bosques";
    const newValue = !ingrediente[column];
    toggleApiState(
      `${API_URL}/planeacion_compra/${ingrediente.id_ingrediente}/toggle-entregado`,
      { [column]: newValue },
      () => (ingrediente[column] = newValue) // Update locally
    );
  };

  const confirmProveedorChange = async (currentEditingIngrediente, selectedValue, closeDropdown) => {
    if (!selectedValue || !currentEditingIngrediente) {
      alert("Selecciona un proveedor válido.");
      return;
    }
    try {
      const updatedData = {
        ...currentEditingIngrediente,
        proveedor: selectedValue,
      };

      const response = await fetch(
        `${API_URL}/planeacion_compra/${currentEditingIngrediente.id_ingrediente}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) throw new Error("Error al actualizar el proveedor.");

      currentEditingIngrediente.proveedor = selectedValue; // Update locally
      closeDropdown();
    } catch (error) {
      console.error("Error al cambiar el proveedor:", error);
      alert("Error al cambiar el proveedor.");
    }
  };

  return {
    toggleYaComprado,
    toggleEntregado,
    confirmProveedorChange,
  };
}
