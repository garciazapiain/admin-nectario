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
  <div class="bg-yellow-800">
    <button @click="() => navigateTo('/inventarios')">Toma Inventario</button>
    <button @click="() => navigateTo('/existenciasresumen')">Resumen Existencias</button>
    <button v-if="isAdmin" @click="() => navigateTo('/compra')">Compra del dia</button>
    <button v-if="isAdmin" @click="() => navigateTo('/platillos')">Platillos</button>
    <button v-if="isAdmin" @click="() => navigateTo('/subplatillos')">Subplatillos</button>
    <button v-if="isAdmin" @click="() => navigateTo('/ingredientes')">Insumos Lista</button>
    <!-- <button v-if="isAdmin" @click="() => navigateTo('/pronosticodemandainsumos')">
      Pronóstico Demanda Insumos
    </button> -->
    <button v-if="isAdmin" @click="() => navigateTo('/historialcompra')">
      Historial Compras
    </button>
    <button v-if="isAdmin" @click="() => navigateTo('/consumoinsumos')">
      Consumo Insumos
    </button>
    <!-- <button v-if="isAdmin" @click="() => navigateTo('/facturacion')">
      Facturación
    </button> -->
  </div>
</template>

<style scoped>
.button-container {
  display: flex;
  flex-wrap: wrap;
}

.button-container button {
  flex: 1 0 20%;
  /* This will make each button take up 25% of the container's width, allowing for 4 items per row */
  box-sizing: border-box;
  margin: 10px;
  padding: 10px;
  height: 10rem;
  font-size: 2rem;
  border: 1px solid #ccc;
  text-align: center;
}
</style>