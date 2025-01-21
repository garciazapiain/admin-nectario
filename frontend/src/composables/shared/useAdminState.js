import { ref } from "vue";

export default function useAdminState() {
  const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

  const setAdminState = (state) => {
    localStorage.setItem("isAdmin", state.toString());
    isAdmin.value = state;
  };

  return { isAdmin, setAdminState };
}
