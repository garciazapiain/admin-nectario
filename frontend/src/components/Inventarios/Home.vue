<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const handleClickMoral = () => {
  router.push("/inventarios/moral");
};

const handleClickBosques = () => {
  router.push("/inventarios/bosques");
};
</script>

<template>
  <div>
    <h1>Inventarios</h1>
    <button @click="handleClickMoral">Moral</button>
    <button @click="handleClickBosques">Bosques</button>
  </div>
</template>

<style scoped>
</style>