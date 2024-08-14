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
    <h1>Inventario</h1>
    <div class="flex flex-wrap">
      <button class="button" @click="handleClickMoral">Moral</button>
      <button class="button" @click="handleClickBosques">Campestre</button>
    </div>
  </div>
</template>

<style scoped>
.button {
  @apply flex-1 basis-1/5 p-4 m-2 w-40 h-40 text-2xl border border-gray-300 text-center;
}
</style>