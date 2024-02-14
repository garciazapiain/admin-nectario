<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

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

</script>

<template>
  <div>
    <h1 @click="handleClickPlatillo">Platillos</h1>
    <h1 @click="handleClickSubplatillo">Subplatillos</h1>
    <h1 @click="handleClickIngrediente">Ingredientes</h1>
    <h1 @click="handleClickInventario">Inventarios</h1>
    <h1 @click="handleClickCompra">Compra</h1>
  </div>
</template>
  
<style scoped>
</style>
