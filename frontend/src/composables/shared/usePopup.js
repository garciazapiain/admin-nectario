import { ref } from "vue";

export default function usePopup() {
  const popupVisible = ref(false); // State to control popup visibility
  const selectedItem = ref(null); // Stores the selected item for the popup

  // Function to show the popup with the given item
  const showPopup = (item) => {
    selectedItem.value = item;
    popupVisible.value = true;
  };

  // Function to close the popup
  const closePopup = () => {
    popupVisible.value = false;
    selectedItem.value = null;
  };

  return {
    popupVisible,
    selectedItem,
    showPopup,
    closePopup,
  };
}
