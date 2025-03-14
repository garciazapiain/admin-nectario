import { computed } from "vue";

export default function usePlaneacionComputed(planeacionCompra) {
  const prioritizedOrder = [
    "CEDIS",
    "CUATRO MILPAS",
    "Transferencia Campestre a Moral",
    "HEB",
    "COSTCO",
    "WALMART",
    "SAMS",
    "Transferencia Moral a Campestre"
  ];

  const groupedByProveedor = computed(() => {
    const grouped = planeacionCompra.value.reduce((acc, ingrediente) => {
      if (!acc[ingrediente.proveedor]) acc[ingrediente.proveedor] = [];
      acc[ingrediente.proveedor].push(ingrediente);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => {
        const indexA = prioritizedOrder.indexOf(a);
        const indexB = prioritizedOrder.indexOf(b);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB; // Keep predefined providers in order
        } else if (indexA !== -1) {
          return -1; // Prioritize predefined providers
        } else if (indexB !== -1) {
          return 1;
        } else {
          return a.localeCompare(b); // Sort remaining providers alphabetically
        }
      })
      .reduce((sortedObj, key) => {
        sortedObj[key] = grouped[key];
        return sortedObj;
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
