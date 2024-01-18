<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const handleClick = (platillo) => {
  console.log(platillo)
  if (platillo.type === 'Platillo') {
    router.push(`/platillo/${platillo.id_platillo}`);
  } else {
    router.push(`/subplatillo/${platillo.id_platillo}`);
  }
};

</script>
<template>
  <div>
    <h1>{{ ingrediente.nombre }}</h1>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(platillo, index) in ingrediente.platillos" :key="index" @click="handleClick(platillo)">
          <td>{{ platillo.nombre }}</td>
          <td>{{ platillo.type }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      ingrediente: {},
    };
  },
  async mounted() {
    // Get the ID from the router
    const id = this.$route.params.id;

    try {
      // Make API call to fetch the platillo data
      const response = await fetch(`http://localhost:3000/api/ingrediente/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Store the fetched data in the component's data
      this.ingrediente = data;
    } catch (error) {
      console.error("Error:", error);
    }
  },
};
</script>

<style scoped>
</style>