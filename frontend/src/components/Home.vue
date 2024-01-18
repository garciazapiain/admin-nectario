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
</script>

<template>
  <div>
    <h1 @click="handleClickPlatillo">Platillos</h1>
    <h1 @click="handleClickSubplatillo">Subplatillos</h1>
    <h1 @click="handleClickIngrediente">Ingredientes</h1>
  </div>
</template>
  
<style scoped>
</style>
