import API_URL from "../../config";

export default function useDragAndDrop(planeacionCompra) {
  let draggedItem = null;

  const startDrag = (ingrediente) => {
    draggedItem = ingrediente;
  };

  const handleDrop = async (targetProveedor) => {
    if (draggedItem && draggedItem.proveedor !== targetProveedor) {
      try {
        const updatedData = { ...draggedItem, proveedor: targetProveedor };
        const response = await fetch(`${API_URL}/planeacion_compra/${draggedItem.id_ingrediente}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });

        if (!response.ok) throw new Error(`Error ${response.status}: Failed to update proveedor`);

        draggedItem.proveedor = targetProveedor;
        planeacionCompra.value = planeacionCompra.value.filter(
          (item) => item.id_ingrediente !== draggedItem.id_ingrediente
        );
        planeacionCompra.value.push(draggedItem);
        draggedItem = null;
      } catch (error) {
        console.error("Error updating proveedor:", error);
      }
    }
  };

  return {
    startDrag,
    handleDrop,
  };
}
