// This component is to add ingredients in platillos/subplatillos component
<template>
  <div>
    <h2>AGREGAR INGREDIENTES</h2>
    <input
      v-model="searchTerm"
      type="text"
      placeholder="BUSCAR INGREDIENTE"
      class="search-input"
    />
    <form @submit.prevent="addIngredient">
      <button class="button" type="submit">AGREGAR INGREDIENTES</button>
      <table>
        <thead>
          <tr>
            <th>AGREGAR</th>
            <th>INGREDIENTE</th>
            <th>UNIDAD</th>
            <th>CANTIDAD</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(ingrediente, index) in ingredientes
              .filter(
                (i) =>
                  !existingIngredientIds.includes(i.id_ingrediente) &&
                  i.nombre.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .sort((a, b) => a.nombre.localeCompare(b.nombre))"
            :key="index"
          >
            <td>
              {{ ingrediente.ingrediente_id }}
              <input
                :id="ingrediente.ingrediente_id"
                type="checkbox"
                v-model="ingrediente.selected"
              />
            </td>
            <td>{{ ingrediente.nombre }}</td>
            <td>{{ ingrediente.unidad }}</td>
            <td>
              <input
                type="number"
                v-model.number="ingrediente.cantidad"
                min="0"
                step="0.001"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p class="mensaje-error">{{ mensajeError }}</p>
      <p class="mensaje-exitoso">{{ ingredienteAgregadoExitosamente }}</p>
    </form>
  </div>
</template>

<script>
export default {
  props: ["ingredientes", "existingIngredientIds", "postUrl"],
  data() {
    return {
      searchTerm: "",
      mensajeError: "",
      ingredienteAgregadoExitosamente: "",
    };
  },
  methods: {
    async addIngredient() {
      const id_platillo = this.$route.params.id;

      const selectedIngredients = this.ingredientes.filter(
        (ing) => ing.selected
      );

      for (const ingrediente of selectedIngredients) {
        // console.log(ingrediente);
        const id_ingrediente = ingrediente.id_ingrediente;
        const cantidad = ingrediente.cantidad;

        // Skip this ingredient if cantidad is null or undefined
        if (cantidad == null || cantidad === 0) {
          this.mensajeError = "Cantidad no puede ser 0";
          // Clear the error message after 5 seconds
          setTimeout(() => {
            this.mensajeError = "";
          }, 5000);
          continue;
        }

        try {
          const response = await fetch(
            `${this.postUrl}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id_ingrediente, cantidad }),
            }
          );

          // Check if the request was successful
          if (response.ok) {
            this.ingredienteAgregadoExitosamente =
              "Ingrediente agregado exitosamente";

            // Clear the success message after 5 seconds
            setTimeout(() => {
              this.ingredienteAgregadoExitosamente = "";
            }, 5000);
          }

          // ...
        } catch (error) {
          console.error("Error:", error);
        }
      }

      // Emit event after successful addition
      this.$emit("ingredientAdded");
    },
  },
};
</script>

<style scoped>
.search-input {
  width: 50%;
  margin-bottom: 1rem;
  padding: 1rem;
  font-size: 1rem;
}
.mensaje-error {
  color: red;
}
.mensaje-exitoso {
  color: green;
}
.button {
  width: fit-content;
  margin: 10px 0;
  padding: 1rem;
  color: white;
  background-color: black;
}
</style>