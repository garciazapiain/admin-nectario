<script setup>
import { useRouter } from "vue-router";
import BaseButton from "../../components/BaseButton.vue";

const router = useRouter();
const handleClickSubPlatillo = (idSubplatillo) => {
  router.push(`/subplatillos/${idSubplatillo}`);
};
</script>

<template>
  <div>
    <h1>Subplatillos</h1>
    <div class="flex m-4">
      <input class="h-8 w-4/6" v-model="searchTerm" placeholder="Buscar" />
      <BaseButton bgColor="bg-green-700" textColor="text-white" fontSize="text-base" @click="scrollToBottomAgregarSubPlatillo">Agregar Subplatillo</BaseButton>
    </div>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Rendimiento</th>
        </tr>
      </thead>
      <tbody>
        <tr @click="handleClickSubPlatillo(subplatillo.id_subplatillo)"
          v-for="(subplatillo, index) in filteredSubPlatillos" :key="index">
          <td>{{ subplatillo.nombre }}</td>
          <td>{{ subplatillo.unidad }}</td>
          <td>{{ subplatillo.rendimiento }}</td>
        </tr>
      </tbody>
    </table>
    <form id="agregarSubPlatilloForm" @submit.prevent="agregarSubPlatillo">
      <input v-model="nuevoSubPlatillo.nombre" placeholder="Nombre" required />
      <select class="select-field " v-model="nuevoSubPlatillo.unidad" required>
        <option disabled value="">Unidad</option>
        <option v-for="unidad in unidades" :key="unidad" :value="unidad">
          {{ unidad }}
        </option>
      </select>
      <input v-model="nuevoSubPlatillo.rendimiento" placeholder="Rendimiento" type="number" min="0.01" step="0.01" required />
      <BaseButton bgColor="bg-green-700" textColor="text-white" fontSize="text-base" type="submit">Agregar Subplatillo</BaseButton>
    </form>
  </div>
</template>

<script>
import API_URL from "../../config";

export default {
  name: "Subplatillos",
  data() {
    return {
      subplatillos: [],
      unidades: [],
      nuevoSubPlatillo: {
        nombre: "",
        unidad: "",
        rendimiento: "",
      },
      searchTerm: ""
    };
  },
  methods: {
    async agregarSubPlatillo() {
      this.nuevoSubPlatillo.rendimiento = parseFloat(
        this.nuevoSubPlatillo.rendimiento
      );
      const response = await fetch(`${API_URL}/subplatillos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.nuevoSubPlatillo),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.subplatillos.push(this.nuevoSubPlatillo);
      this.nuevoSubPlatillo = { nombre: "", unidad: "", rendimiento: "" };
      window.location.reload()
    },
    scrollToBottomAgregarSubPlatillo() {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });

      // Highlight the form after scrolling
      const formElement = document.querySelector("#agregarSubPlatilloForm");
      if (formElement) {
        formElement.classList.add("highlight"); // Add the highlight class
        setTimeout(() => {
          formElement.classList.remove("highlight"); // Remove the highlight class after 3 seconds
        }, 3000); // 3000 milliseconds = 3 seconds
      }
    }
  },
  computed: {
    filteredSubPlatillos() {
      // Add this computed property
      if (!this.searchTerm) {
        return this.subplatillos;
      }
      const term = this.searchTerm.toLowerCase();
      return this.subplatillos.filter((subplatillo) =>
        subplatillo.nombre.toLowerCase().includes(term)
      );
    },
  },
  async mounted() {
    try {
      // Fetching subplatillos
      const responseSubplatillos = await fetch(`${API_URL}/subplatillos`);
      if (!responseSubplatillos.ok) {
        throw new Error(`HTTP error! status: ${responseSubplatillos.status}`);
      }
      this.subplatillos = await responseSubplatillos.json();
      // Fetching unidades
      const responseUnidades = await fetch(`${API_URL}/unidades`);
      if (!responseUnidades.ok) {
        throw new Error(`HTTP error! status: ${responseUnidades.status}`);
      }
      this.unidades = await responseUnidades.json();
    } catch (error) {
      console.error("Error:", error);
    }
  }
};
</script>

<style scoped>
.highlight {
  animation: highlight-effect 3s ease-in-out;
}

@keyframes highlight-effect {
  0% {
    background-color: yellow;
  }

  50% {
    background-color: lightgreen;
  }

  100% {
    background-color: transparent;
  }
}
</style>