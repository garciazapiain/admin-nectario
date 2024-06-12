<script setup>
import { ref, onMounted, watch } from "vue";
import API_URL from "../../config";

const ingredientes = ref([]);
const selected = ref(null);

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