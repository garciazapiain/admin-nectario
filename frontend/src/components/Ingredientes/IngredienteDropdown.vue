<script setup>
import { ref, onMounted, watch } from "vue";

const ingredientes = ref([]);
const selected = ref(null);

const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
    : "http://localhost:3000/api";

onMounted(async () => {
  const response = await fetch(`${API_URL}/ingredientes/demanda`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  ingredientes.value = await response.json();
});

watch(selected, (newVal) => {
  emit("update:modelValue", newVal);
});
</script>

<template>
  <select v-model="selected">
    <option
      v-for="(ingrediente, index) in ingredientes"
      :key="index"
      :value="ingrediente.id_ingrediente"
    >
      {{ ingrediente.nombre }}
    </option>
  </select>
</template>