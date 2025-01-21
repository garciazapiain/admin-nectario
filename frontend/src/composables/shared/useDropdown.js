// src/composables/shared/useDropdown.js
import { ref } from "vue";

export default function useDropdown(initialValue = "") {
  const isDropdownVisible = ref(false); // Controls dropdown visibility
  const selectedValue = ref(initialValue); // Tracks the current selected value

  const toggleDropdown = () => {
    isDropdownVisible.value = !isDropdownVisible.value;
  };

  const selectOption = (value) => {
    selectedValue.value = value;
    isDropdownVisible.value = false; // Close dropdown after selection
  };

  const closeDropdown = () => {
    isDropdownVisible.value = false;
  };

  return {
    isDropdownVisible,
    selectedValue,
    toggleDropdown,
    selectOption,
    closeDropdown,
  };
}
