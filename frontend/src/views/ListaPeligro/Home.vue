<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

const router = useRouter();

const handleClickMoral = () => {
  router.push("/listapeligro/moral");
};

const handleClickBosques = () => {
  router.push("/listapeligro/bosques");
};

const handleClickCedis = () => {
  router.push("/listapeligro/cedis");
};

</script>

<template>
  <div>
    <h1>Lista Peligro</h1>
    <div class="flex flex-wrap">
      <button class="button" @click="handleClickMoral">Moral</button>
      <button class="button" @click="handleClickBosques">Campestre</button>
      <button v-if="isAdmin" class="button" @click="handleClickCedis">CEDIS</button>
    </div>
  </div>
</template>

<style scoped>
.button {
  @apply flex-1 basis-1/5 p-4 m-2 w-40 h-40 text-2xl border border-gray-300 text-center;
}
</style>