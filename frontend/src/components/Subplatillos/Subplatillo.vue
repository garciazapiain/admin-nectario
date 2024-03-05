<script setup>
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
    : "http://localhost:3000/api";
import { useRouter } from "vue-router";
const router = useRouter();
const handleClickIngrediente = (idIngrediente) => {
  router.push(`/ingrediente/${idIngrediente}`);
};
</script>
<template>
  <div>
    <h1>{{ subplatillo.nombre }}</h1>
    <table>
      <thead>
        <tr>
          <th>Ingredientes</th>
          <th>Unidad</th>
          <th>Cantidad</th>
          <th>$/Cantidad</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(ingrediente, index) in subplatillo.ingredients"
          :key="index"
        >
          <td @click="handleClickIngrediente(ingrediente.id_ingrediente)">
            {{ ingrediente.nombre }}
          </td>
          <td @click="handleClickIngrediente(ingrediente.id_ingrediente)">
            {{ ingrediente.unidad }}
          </td>
          <td @click="handleClickIngrediente(ingrediente.id_ingrediente)">
            {{ ingrediente.cantidad }}
          </td>
          <td>
            $
            {{ (ingrediente.precio * ingrediente.cantidad).toFixed(2) }}
          </td>
        </tr>
      </tbody>
    </table>
    <p>COSTO TOTAL: ${{ totalCost.toFixed(2) }} / {{ subplatillo.unidad }}</p>
    <p>RENDIMIENTO: {{ subplatillo.rendimiento }} {{ subplatillo.unidad }}</p>
    <p>
      COSTO / {{ subplatillo.unidad }}: ${{
        (totalCost / subplatillo.rendimiento).toFixed(2)
      }}
    </p>
    <IngredientForm
      :ingredientes="ingredientes"
      :existingIngredientIds="existingIngredientIds"
      :postUrl="`${API_URL}/subplatillos/${$route.params.id}/ingredientes`"
      @ingredientAdded="fetchData"
    />
  </div>
</template>

<script>
import IngredientForm from "../Ingredientes/IngredientForm.vue";
export default {
  data() {
    return {
      subplatillo: {},
      ingredientes: [], // Define ingredientes here
    };
  },
  components: {
    IngredientForm,
  },
  computed: {
    existingIngredientIds() {
      return this.subplatillo.ingredients
        ? this.subplatillo.ingredients.map((i) => i.id_ingrediente)
        : [];
    },
    totalCost() {
      return this.subplatillo.ingredients
        ? this.subplatillo.ingredients.reduce(
            (total, ingrediente) =>
              total + ingrediente.precio * ingrediente.cantidad,
            0
          )
        : 0;
    },
  },
  async mounted() {
    this.fetchData();
    this.fetchIngredientes();
  },
  methods: {
    async fetchData() {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      const id = this.$route.params.id;
      try {
        const response = await fetch(`${API_URL}/subplatillo/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.subplatillo = data;
      } catch (error) {
        console.error("Error:", error);
      }
    },
    async fetchIngredientes() {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      try {
        const response = await fetch(`${API_URL}/ingredientes`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.ingredientes = data;
      } catch (error) {
        console.error("Error:", error);
      }
    },
  },
};
</script>

<style scoped>
</style>