// src/composables/shared/useSorting.js
export default function useSorting() {
  // Function to sort items based on a condition
  const sortItems = (items, comparator) => {
    if (!Array.isArray(items)) {
    console.error("Provided items are not an array");
    return [];
    }
  
    return items.slice().sort(comparator);
  };
  
  // Default comparator: sort by `ya_comprado` status and then by `store_route_order`
  const defaultComparator = (a, b) => {
    if (a.ya_comprado && !b.ya_comprado) return 1; // Move `ya_comprado: true` to the bottom
    if (!a.ya_comprado && b.ya_comprado) return -1; // Keep `ya_comprado: false` at the top
    
    // If `ya_comprado` status is the same, sort by `store_route_order` in ascending order
    if (a.store_route_order < b.store_route_order) return -1;
    if (a.store_route_order > b.store_route_order) return 1;
    
    return 0; // Maintain order for items with the same status and `store_route_order`
  };
  
  return {
    sortItems,
    defaultComparator,
  };
  }