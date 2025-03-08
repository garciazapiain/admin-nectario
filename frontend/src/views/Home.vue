<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import 'tailwindcss/tailwind.css'

const router = useRouter();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
const userName = ref(localStorage.getItem("userName"))

const navigateTo = (route) => {
  router.push(route);
};

onMounted(() => {
  if (!localStorage.getItem("jwt")) {
    router.push("/login");
  }
});
</script>

<template>
  <div class='flex flex-col'>
    <div>
      <button class="button" @click="() => navigateTo('/listapeligro')">Lista Peligro</button>
      <button class="button" @click="() => navigateTo('/existenciasresumen')">Resumen Existencias</button>
    </div>
    <div>
      <button class="button" @click="() => navigateTo('/platillos')">Platillos</button>
      <button class="button" @click="() => navigateTo('/subplatillos')">Subplatillos</button>
      <button class="button" @click="() => navigateTo('/ingredientes')">Insumos</button>
    </div>
    <div>
      <button v-if="userName === 'moral' || userName==='campestre' || isAdmin" class="button"  @click="() => navigateTo('/planeacioncompra')">Pedido</button>
      <button class="button" @click="() => navigateTo('/compradeldia')">Compra</button>
      <button v-if="isAdmin" class="button" @click="() => navigateTo('/consumoinsumos')">
        Consumo Teórico Insumos
      </button>
    </div>
  </div>
</template>

<style scoped>
.button {
  @apply flex-1 basis-1/5 p-4 m-2 h-40 text-2xl border border-gray-300 text-center hover:bg-white hover:text-black;
}
</style>