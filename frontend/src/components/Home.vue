<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

const handleClickPlatillo = () => {
  router.push("/platillos");
};

const handleClickSubplatillo = () => {
  router.push("/subplatillos");
};

const handleClickIngrediente = () => {
  router.push("/ingredientes");
};

const handleClickInventario = () => {
  router.push("/inventarios");
};

const handleClickExistencias = () => {
  router.push("/existenciasresumen");
};

const handleClickCompra = () => {
  router.push("/compra");
};

const handleClickPronosticoDemandaInsumos = () => {
  router.push("/pronosticodemandainsumos");
};

const handleClickHistorialCompra = () => {
  router.push("/historialcompra");
};

const handleClickConsumoInsumos = () => {
  router.push("/consumoinsumos");
};

onMounted(() => {
  if (!localStorage.getItem("jwt")) {
    router.push("/login");
  }
});
</script>

<template>
  <div class="button-container">
    <button @click="handleClickInventario">Toma Inventario</button>
    <button @click="handleClickExistencias">Resumen Existencias</button>
    <button v-if="isAdmin" @click="handleClickCompra">Compra del dia</button>
    <button v-if="isAdmin" @click="handleClickPlatillo">Platillos</button>
    <button v-if="isAdmin" @click="handleClickSubplatillo">Subplatillos</button>
    <button v-if="isAdmin" @click="handleClickIngrediente">Insumos Info</button>
    <button v-if="isAdmin" @click="handleClickPronosticoDemandaInsumos">
      Pronóstico Demanda Insumos
    </button>
    <button v-if="isAdmin" @click="handleClickHistorialCompra">
      Historial Compras
    </button>
    <button v-if="isAdmin" @click="handleClickConsumoInsumos">
      Consumo Insumos
    </button>
  </div>
</template>

<style scoped>
.button-container {
  display: flex;
  flex-wrap: wrap;
}

.button-container button {
  flex: 1 0 20%; /* This will make each button take up 25% of the container's width, allowing for 4 items per row */
  box-sizing: border-box;
  margin: 10px;
  padding: 10px;
  height: 10rem;
  font-size: 2rem;
  border: 1px solid #ccc;
  text-align: center;
}
</style>