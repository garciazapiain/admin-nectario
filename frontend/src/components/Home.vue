<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import 'tailwindcss/tailwind.css'

const router = useRouter();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
const isChef = ref(localStorage.getItem("isChef") === "true");

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
      <button class="button" v-if="isAdmin" @click="() => navigateTo('/compra')">Compra del dia</button>
      <button class="button" @click="() => navigateTo('/platillos')">Platillos</button>
      <button class="button" @click="() => navigateTo('/subplatillos')">Subplatillos</button>
      <button class="button" @click="() => navigateTo('/ingredientes')">Insumos</button>
      <button class="button" v-if="isAdmin" @click="() => navigateTo('/entradasysalidas')">Entradas y Salidas</button>
      <!-- <button class="button" v-if="isAdmin" @click="() => navigateTo('/inventarios')">
      Inventarios
    </button> -->
      <!-- <button class="button"  v-if="isAdmin" @click="() => navigateTo('/facturacion')">
      Facturación
    </button> -->
    </div>
    <div>
      <!-- <button class="button" v-if="isAdmin" @click="() => navigateTo('/pronosticodemandainsumos')">
        Pronóstico Demanda Insumos
      </button> -->
      <button class="button" v-if="isAdmin" @click="() => navigateTo('/historialcompra')">
        Historial Compras
      </button>
      <button class="button" v-if="isAdmin" @click="() => navigateTo('/consumoinsumos')">
        Consumo Teórico Insumos
      </button>
      <button class="button" v-if="isAdmin" @click="() => navigateTo('/analisis-consumo')">
        Análisis de Consumo
      </button>
    </div>
  </div>
</template>

<style scoped>
.button {
  @apply flex-1 basis-1/5 p-4 m-2 h-40 text-2xl border border-gray-300 text-center;
}
</style>