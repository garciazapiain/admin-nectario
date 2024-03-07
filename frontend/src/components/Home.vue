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

const handleClickCompra = () => {
  router.push("/compra");
};

const handleClickPronosticoDemandaInsumos = () => {
  router.push("/pronosticodemandainsumos");
};

onMounted(() => {
  if (!localStorage.getItem("jwt")) {
    router.push("/login");
  }
});
</script>

<template>
  <div>
    <h1 @click="handleClickInventario">Inventarios</h1>
    <h1 @click="handleClickCompra">Compra</h1>
    <h1 v-if="isAdmin" @click="handleClickPlatillo">Platillos</h1>
    <h1 v-if="isAdmin" @click="handleClickSubplatillo">Subplatillos</h1>
    <h1 v-if="isAdmin" @click="handleClickIngrediente">Insumos</h1>
    <h1 v-if="isAdmin" @click="handleClickPronosticoDemandaInsumos">Pronostico Demanda Insumos</h1>
  </div>
</template>
  
<style scoped>
</style>