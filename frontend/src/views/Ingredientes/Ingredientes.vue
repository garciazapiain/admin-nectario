<template>
  <div>
    <ArrowToPageNavigateDown />
    <h1>Insumos</h1>
    <SearchBar v-model="searchTerm" placeholder="Buscar insumo..."></SearchBar>
    <table>
      <thead>
        <tr>
          <th>Código del insumo</th>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Precio</th>
          <th>Proveedor</th>
          <!-- <th>Total usado</th>
          <th>Total $ Comprado</th> -->
          <!-- <th>Total usado / año</th> -->
          <!-- <th>Total $ Comprado / año</th> -->
        </tr>
      </thead>
      <tbody>
        <tr @click="handleClickIngrediente(ingrediente.id_ingrediente)"
          v-for="(ingrediente, index) in filteredIngredients" :key="index">
          <td>{{ ingrediente.id_ingrediente }}</td>
          <td>{{ ingrediente.nombre }}</td>
          <td>{{ ingrediente.unidad }}</td>
          <td>${{ ingrediente.precio }}</td>
          <td>{{ ingrediente.proveedor }}</td>
          <!-- <td>
            {{ Math.round(ingrediente.total_usado) + " " + ingrediente.unidad }}
          </td>
          <td>
            ${{
              new Intl.NumberFormat().format(
                (ingrediente.total_usado * ingrediente.precio).toFixed(2)
              )
            }}
          </td> -->
          <!-- <td>
            {{
              Math.round(ingrediente.total_usado * 52) +
              " " +
              ingrediente.unidad
            }}
          </td>
          <td>
            ${{
              new Intl.NumberFormat().format(
                (ingrediente.total_usado * ingrediente.precio * 52).toFixed(2)
              )
            }}
          </td> -->
        </tr>
      </tbody>
    </table>
    <div v-if="isAdmin" class="add-new-ingredient-form w-full max-w-2xl mx-auto p-5 shadow-lg rounded-lg">
      <h2>Agregar nuevo insumo</h2>
      <form @submit.prevent="agregarIngrediente" class="flex flex-col space-y-4 p-6 bg-white shadow-lg rounded-lg">
        <!-- Input for Nombre -->
        <input v-model="nuevoIngrediente.nombre" placeholder="Nombre" required
          class="w-full h-10 px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />

        <!-- Dropdown for Unidad -->
        <Dropdown v-model="nuevoIngrediente.unidad" :options="unidadOptions"
          :defaultOption="{ value: '', label: 'Selecciona una unidad' }" />

        <!-- Input for Precio -->
        <input type="number" v-model="nuevoIngrediente.precio" placeholder="Precio" required
          class="w-full h-10 px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />

        <!-- Dropdown for Proveedor -->
        <Dropdown v-model="nuevoIngrediente.proveedor_id" :options="proveedorOptions"
          :defaultOption="{ value: '', label: 'Selecciona un proveedor' }" />

        <!-- Submit Button -->
        <BaseButton bgColor="bg-violet-800" textColor="text-white" fontSize="text-base" type="submit"
          class="w-full h-12 flex items-center justify-center bg-violet-800 text-white rounded-lg hover:bg-violet-900 transition-all">
          Agregar Insumo
        </BaseButton>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Dropdown from "../../components/Dropdown.vue";
import BaseButton from "../../components/BaseButton.vue";
import ArrowToPageNavigateDown from "../../components/ArrowToPageNavigateDown.vue";
import SearchBar from "../../components/SearchBar.vue";
import API_URL from "../../config";

// Reactive State
const router = useRouter();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

const ingredientes = ref([]);
const nuevoIngrediente = ref({
  nombre: "",
  unidad: "",
  precio: "",
  proveedor: "",
  proveedor_id: "",
});
const searchTerm = ref("");
const proveedores = ref([]);
const unidades = ref([]);

// Computed Properties
const unidadOptions = computed(() =>
  unidades.value.map((unidad) => ({
    value: unidad,
    label: unidad,
  }))
);

const proveedorOptions = computed(() =>
  proveedores.value.map((proveedor) => ({
    value: proveedor.id,
    label: proveedor.nombre,
  }))
);

const filteredIngredients = computed(() => {
  const term = searchTerm.value.toLowerCase();
  return term
    ? ingredientes.value.filter((ingrediente) =>
      ingrediente.nombre.toLowerCase().includes(term)
    )
    : ingredientes.value;
});

// Methods
const handleClickIngrediente = (idIngrediente) => {
  router.push(`/ingredientes/${idIngrediente}`);
};

const agregarIngrediente = async () => {
  try {
    const response = await fetch(`${API_URL}/ingredientes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevoIngrediente.value),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    ingredientes.value.push(nuevoIngrediente.value);
    nuevoIngrediente.value = {
      nombre: "",
      unidad: "",
      precio: "",
      proveedor: "",
      proveedor_id: "",
    };
  } catch (error) {
    console.error("Error adding ingredient:", error);
  }
};

// Fetch Data on Mount
const fetchData = async () => {
  try {
    const unidadesResponse = await fetch(`${API_URL}/unidades`);
    if (!unidadesResponse.ok) throw new Error("Error fetching unidades");
    unidades.value = await unidadesResponse.json();

    const proveedoresResponse = await fetch(`${API_URL}/proveedores`);
    if (!proveedoresResponse.ok) throw new Error("Error fetching proveedores");
    proveedores.value = await proveedoresResponse.json();

    const ingredientesResponse = await fetch(`${API_URL}/ingredientes/demanda`);
    if (!ingredientesResponse.ok)
      throw new Error("Error fetching ingredientes");
    ingredientes.value = await ingredientesResponse.json();

    // Optional: Sort ingredients
    ingredientes.value.sort(
      (a, b) => b.total_usado * b.precio - a.total_usado * a.precio
    );
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

onMounted(fetchData);
</script>

<style scoped>
</style>