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
  
    const shouldTransfer = (ingrediente, moralInventory, bosquesInventory) => {
      if (
        moralInventory < ingrediente.moral_demanda_semanal / 7 ||
        bosquesInventory < ingrediente.bosques_demanda_semanal / 7
      ) {
        // Calculate transfer suggestions
        const totalDemand =
          ingrediente.moral_demanda_semanal + ingrediente.bosques_demanda_semanal;
        const totalInventory = moralInventory + bosquesInventory;
  
        const percentMoral =
          ingrediente.moral_demanda_semanal / totalDemand;
        const percentBosques =
          ingrediente.bosques_demanda_semanal / totalDemand;
  
        const adjustMoral = Math.round(percentMoral * totalInventory);
        const adjustBosques = Math.round(percentBosques * totalInventory);
  
        return `Ajuste Moral: ${adjustMoral}, Ajuste Campestre: ${adjustBosques}`;
      }
      return "Inventario Suficiente";
    };
  
    return { getInventory, shouldTransfer };
  }
  