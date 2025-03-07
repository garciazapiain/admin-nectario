import { computed } from "vue";

export default function usePlaneacionComputed(planeacionCompra) {
  const groupedByProveedor = computed(() => {
    return planeacionCompra.value.reduce((grouped, ingrediente) => {
      if (!grouped[ingrediente.proveedor]) grouped[ingrediente.proveedor] = [];
      grouped[ingrediente.proveedor].push(ingrediente);
      return grouped;
    }, {});
  });

  const moralOrders = computed(() =>
    planeacionCompra.value
      .filter((ingrediente) => ingrediente.surtir_moral != null && ingrediente.surtir_moral !== "")
      .sort((a, b) => (a.ya_entregado_moral === b.ya_entregado_moral ? 0 : a.ya_entregado_moral ? 1 : -1))
  );

  const bosquesOrders = computed(() =>
    planeacionCompra.value
      .filter((ingrediente) => ingrediente.surtir_campestre != null && ingrediente.surtir_campestre !== "")
      .sort((a, b) => (a.ya_entregado_bosques === b.ya_entregado_bosques ? 0 : a.ya_entregado_bosques ? 1 : -1))
  );

  return {
    groupedByProveedor,
    moralOrders,
    bosquesOrders,
  };
}
