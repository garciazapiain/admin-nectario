export default function useInventory() {
  const getInventory = (storeName, ingredientId, submissions) => {
    console.log(storeName, ingredientId, submissions)
    const submission = submissions.find(
      (submission) => submission.store === storeName
    );

    if (!submission) return "N/A";

    const ingrediente = submission.compra.find(
      (ing) => ing.id_ingrediente === ingredientId
    );
    return ingrediente ? ingrediente.cantidad_inventario : "N/A";
  };

  // const shouldTransfer = (ingrediente, submissions) => {
  //   const moralInventory = getInventory("moral", ingrediente.id_ingrediente, submissions);
  //   const bosquesInventory = getInventory("bosques", ingrediente.id_ingrediente, submissions);

  //   if (
  //     moralInventory < ingrediente.moral_demanda_semanal / 7 ||
  //     bosquesInventory < ingrediente.bosques_demanda_semanal / 7
  //   ) {
  //     // Calculate transfer suggestions
  //     const totalDemand = ingrediente.moral_demanda_semanal + ingrediente.bosques_demanda_semanal;
  //     const totalInventory = moralInventory + bosquesInventory;

  //     const percentMoral = ingrediente.moral_demanda_semanal / totalDemand;
  //     const percentBosques = ingrediente.bosques_demanda_semanal / totalDemand;

  //     let adjustMoral = Math.round(percentMoral * totalInventory);
  //     let adjustBosques = Math.round(percentBosques * totalInventory);

  //     // Adjustments for specific unit types
  //     const unitsToFixed1 = ["KG", "CAJA", "POMO", "TUBO", "BOTE", "BOLSA"];
  //     const toFixedValue = unitsToFixed1.includes(ingrediente.unidad) ? 1 : 0;
  //     adjustMoral = parseFloat(adjustMoral.toFixed(toFixedValue));
  //     adjustBosques = parseFloat(adjustBosques.toFixed(toFixedValue));

  //     // Ensure adjustments match total inventory
  //     const adjustmentDifference = totalInventory - (adjustMoral + adjustBosques);
  //     adjustMoral += adjustmentDifference;

  //     return `Ajuste Moral: ${adjustMoral}, Ajuste Campestre: ${adjustBosques}`;
  //   }

  //   return "Inventario Suficiente";
  // };

  return { getInventory };
}
