<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import 'tailwindcss/tailwind.css'

const router = useRouter();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

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
  <div class="flex flex-wrap">
    <button class="button" @click="() => navigateTo('/pedidos')">Pedidos</button>
    <button class="button" @click="() => navigateTo('/existenciasresumen')">Resumen Existencias</button>
    <button class="button" v-if="isAdmin" @click="() => navigateTo('/compra')">Compra del dia</button>
    <button class="button" v-if="isAdmin" @click="() => navigateTo('/platillos')">Platillos</button>
    <button class="button" v-if="isAdmin" @click="() => navigateTo('/subplatillos')">Subplatillos</button>
    <button class="button" v-if="isAdmin" @click="() => navigateTo('/ingredientes')">Insumos</button>
    <button class="button" v-if="isAdmin" @click="() => navigateTo('/pronosticodemandainsumos')">
      Pronóstico Demanda Insumos
    </button>
    <button class="button" v-if="isAdmin" @click="() => navigateTo('/historialcompra')">
      Historial Compras
    </button>
    <button class="button" v-if="isAdmin" @click="() => navigateTo('/consumoinsumos')">
      Consumo Insumos
    </button>
    <!-- <button class="button"  v-if="isAdmin" @click="() => navigateTo('/facturacion')">
      Facturación
    </button> -->
  </div>
</template>

<style scoped>
.button {
  @apply flex-1 basis-1/5 p-4 m-2 h-40 text-2xl border border-gray-300 text-center;
}
</style>