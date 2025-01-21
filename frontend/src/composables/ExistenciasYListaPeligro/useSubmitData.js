import { ref } from "vue";
import API_URL from "../../config";

export default function useSubmitData() {
  const submitData = ref([]);

  const updateSubmitData = (ingrediente) => {
    const index = submitData.value.findIndex(
      (i) => i.nombre === ingrediente.nombre
    );
    if (index > -1) {
      submitData.value[index] = {
        ...submitData.value[index],
        cantidad_inventario: ingrediente.cantidad_inventario,
      };
    } else {
      submitData.value.push({
        id_ingrediente: ingrediente.id_ingrediente,
        nombre: ingrediente.nombre,
        unidad: ingrediente.unidad,
        cantidad_inventario: ingrediente.cantidad_inventario,
        proveedor: ingrediente.proveedor,
        moral_demanda_semanal: ingrediente.moral_demanda_semanal,
        bosques_demanda_semanal: ingrediente.bosques_demanda_semanal,
        producto_clave: ingrediente.producto_clave,
      });
    }
  };

  const resetForm = async (store, resetAll = true) => {
    submitData.value.forEach((item) => {
      if (resetAll || !item.producto_clave) {
        item.cantidad_inventario = "Suficiente";
      }
    });

    const endpoint = resetAll
      ? `${API_URL}/ingredientes/resetestatus/${store}`
      : `${API_URL}/ingredientes/no-claves-resetestatus/${store}`;

    await fetch(endpoint, { method: "PUT" });
  };

  return { submitData, updateSubmitData, resetForm };
}
