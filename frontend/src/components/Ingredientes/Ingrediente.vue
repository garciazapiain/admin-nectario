<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const handleClick = (platillo) => {
  if (platillo.type === "Platillo") {
    window.open(`/platillo/${platillo.id_platillo}`, '_blank');
  } else {
    window.open(`/subplatillo/${platillo.id_platillo}`, '_blank');
  }
};
import { ref } from "vue";
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
</script>
<template>
  <div>
    <h1>{{ ingrediente.nombre }}</h1>
    <h2>
      Info del insumo:
      <button v-if="isAdmin" @click="showModal = true">Editar</button>
    </h2>
    <div v-if="showModal" class="modal">
      <form @submit.prevent="editIngrediente" class="grid grid-cols-2 gap-4 edit-form">
        <div class="form-group">
          <label for="nombre">Nombre:</label>
          <input id="nombre" v-model="ingredienteEditado.nombre" />
        </div>
        <div class="form-group">
          <label for="proveedor">Proveedor:</label>
          <select id="proveedor" v-model="ingredienteEditado.proveedor" @change="updateProveedor">
            <option disabled value="">Selecciona un proveedor</option>
            <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
              {{ proveedor.nombre }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="unidad">Unidad:</label>
          <select id="unidad" v-model="ingredienteEditado.unidad">
            <option disabled value="">Selecciona una unidad</option>
            <option v-for="(unidad, index) in unidades" :key="index" :value="unidad">
              {{ unidad }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="precio">Costo limpio (contando % MERMA):</label>
          <input id="precio" v-model="ingredienteEditado.precio" />
        </div>
        <div class="form-group">
          <label for="merma">% MERMA:</label>
          <input id="merma" type="number" v-model="ingredienteEditado.merma" min="0" max="0.99" step="0.01" />
        </div>
        <div class="form-group">
          <label for="store_route_order">Orden ruta de tienda:</label>
          <input id="store_route_order" type="number" v-model.number="ingredienteEditado.store_route_order" />
        </div>
        <div class="form-group">
          <label for="lista_peligro">Lista peligro</label>
          <select id="lista_peligro" v-model="ingredienteEditado.producto_clave">
            <option value="true">Si</option>
            <option value="false">No</option>
          </select>
        </div>
        <div class="form-group">
          <label for="orden_inventario">Orden toma de Inventario:</label>
          <input id="orden_inventario" type="number" step="0.1" v-model.number="ingredienteEditado.orden_inventario" />
        </div>
        <div class="form-group">
          <label for="moral_demanda_semanal">Moral Demanda Semanal:</label>
          <input id="moral_demanda_semanal" type="number" step="0.01"
            v-model.number="ingredienteEditado.moral_demanda_semanal" />
        </div>
        <div class="form-group">
          <label for="bosques_demanda_semanal">Campestre Demanda Semanal:</label>
          <input id="bosques_demanda_semanal" type="number" step="0.01"
            v-model.number="ingredienteEditado.bosques_demanda_semanal" />
        </div>
        <div class="form-group">
          <label for="frecuencias_inventario">Frecuencias de Inventario:</label>
          <select id="frecuencias_inventario" v-model="ingredienteEditado.frecuencias_inventario" multiple>
            <option disabled value="">Selecciona una frecuencia</option>
            <option value="1">Inicio primer turno</option>
            <option value="2">Inicio segundo turno</option>
            <option value="3">Fin segundo turno</option>
            <option value="4">No inventarear</option>
          </select>
        </div>
        <div class="form-group">
          <label for="image">Actualizar Imagen Opción A:</label>
          <input id="image" type="file" @change="handleFileUpload('image_url', $event)" />
        </div>
        <div class="form-group">
          <label for="image_2">Actualizar Imagen Opción B:</label>
          <input id="image_2" type="file" @change="handleFileUpload('image_url_2', $event)" />
        </div>
        <div v-if="ingredienteEditado.image_url">
          <label>Imagen Opción A:</label>
          <img :src="ingredienteEditado.image_url" alt="Ingrediente Imagen Opcion A" width="200" />
        </div>
        <div v-else>
          <span>No hay imagen disponible para Opción A</span>
        </div>

        <div v-if="ingredienteEditado.image_url_2">
          <label>Imagen Opción B:</label>
          <img :src="ingredienteEditado.image_url_2" alt="Ingrediente Imagen Opcion B" width="200" />
        </div>
        <div v-else>
          <span>No hay imagen disponible para Opción B</span>
        </div>
        <div class="grid grid-cols-2 gap-4 form-actions">
          <button type="submit">Guardar</button>
          <button @click="showModal = false">Cancelar</button>
        </div>
      </form>
    </div>
    <table>
      <tbody>
        <tr>
          <td><strong>Proveedor:</strong></td>
          <td>{{ ingrediente.proveedor }}</td>
        </tr>
        <tr>
          <td><strong>Unidad:</strong></td>
          <td>{{ ingrediente.unidad }}</td>
        </tr>
        <tr>
          <td><strong>Costo limpio (contando % MERMA):</strong></td>
          <td>${{ ingrediente.precio }}</td>
        </tr>
        <tr>
          <td><strong>% MERMA:</strong></td>
          <td>{{ (ingrediente.merma * 100).toFixed(0) }}%</td>
        </tr>
        <tr>
          <td><strong>Orden ruta de tienda:</strong></td>
          <td>{{ ingrediente.store_route_order }}</td>
        </tr>
        <tr>
          <td><strong>Lista Peligro:</strong></td>
          <td>{{ ingrediente.producto_clave ? "Si" : "No" }}</td>
        </tr>
        <tr>
          <td><strong>Orden toma de Inventario:</strong></td>
          <td>{{ ingrediente.orden_inventario }}</td>
        </tr>
        <tr>
          <td><strong>Moral Demanda Semanal:</strong></td>
          <td>{{ ingrediente.moral_demanda_semanal }} <span v-if="ingrediente.moral_demanda_semanal">{{
            ingrediente.unidad }}</span></td>
        </tr>
        <tr>
          <td><strong>Campestre Demanda Semanal:</strong></td>
          <td>{{ ingrediente.bosques_demanda_semanal }} <span v-if="ingrediente.bosques_demanda_semanal">{{
            ingrediente.unidad }}</span></td>
        </tr>
        <tr>
          <td><strong>Imagen Opción A:</strong></td>
          <td>
            <img v-if="ingrediente.image_url" :src="ingrediente.image_url" alt="Ingrediente Imagen Opcion A"
              width="200" />
            <span v-else>No hay imagen disponible</span>
          </td>
        </tr>
        <tr>
          <td><strong>Imagen Opción B:</strong></td>
          <td>
            <img v-if="ingrediente.image_url_2" :src="ingrediente.image_url_2" alt="Ingrediente Imagen Opcion B"
              width="200" />
            <span v-else>No hay imagen disponible</span>
          </td>
        </tr>
        <tr>
          <td><strong>Frecuencias de Inventario:</strong></td>
          <td>
            <span v-for="(frecuencia, index) in ingrediente.frecuencias_inventario" :key="index">
              {{ displayFrecuencia(frecuencia) }}
              <span v-if="index < ingrediente.frecuencias_inventario.length - 1">, </span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <h2>Platillos/Subplatillos donde se usa el insumo:</h2>
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
import API_URL from "../../config";

export default {
  data() {
    return {
      ingrediente: {},
      ingredienteEditado: {},
      showModal: false,
      proveedores: [],
      unidades: [],
      inputDaysBosques: 1,
      inputDaysMoral: 1,
      selectedImage: null, // Add this line to define selectedImage
      selectedImage2: null
    };
  },
  computed: {
    proveedorNombre() {
      const proveedor = this.proveedores.find(
        (p) => p.id === this.ingredienteEditado.proveedor
      );
      return proveedor ? proveedor.nombre : "";
    },
  },
  methods: {
    calculateDemandDays(weeklyDemand, store) {
      return (
        (weeklyDemand / 7) *
        (store === "moral" ? this.inputDaysMoral : this.inputDaysBosques)
      );
    },
    displayFrecuencia(frecuencia) {
      switch (frecuencia) {
        case "inicio_primer_turno":
          return "Inicio primer turno";
        case "inicio_segundo_turno":
          return "Inicio segundo turno";
        case "fin_segundo_turno":
          return "Fin segundo turno";
        case "no_inventarear":
          return "No inventarear";
        default:
          return frecuencia;
      }
    },
    updateProveedor(event) {
      const selectedProveedor = this.proveedores.find(
        (proveedor) => proveedor.nombre === event.target.value
      );
      if (selectedProveedor) {
        this.ingredienteEditado.proveedor = selectedProveedor.nombre;
        this.ingredienteEditado.proveedor_id = selectedProveedor.id;
      }
    },
    handleFileUpload(type, event) {
      const file = event.target.files[0];
      if (file) {
        console.log("Uploading:", type, file);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("id_ingrediente", this.ingredienteEditado.id_ingrediente);
        formData.append("image_type", type); // Specify which image is being uploaded

        fetch(`${API_URL}/ingredient_image/upload`, {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Image upload failed: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            console.log("Image uploaded:", data);
            if (type === "image_url") {
              this.ingredienteEditado.image_url = data.image_url;
            } else if (type === "image_url_2") {
              this.ingredienteEditado.image_url_2 = data.image_url;
            }
          })
          .catch((error) => {
            console.error("Error during image upload:", error);
          });
      } else {
        console.warn("No file selected.");
      }
    },
    async editIngrediente() {
      const id = this.$route.params.id;

      let imageUrl = this.ingredienteEditado.image_url; // Default to existing image_url
      let imageUrl2 = this.ingredienteEditado.image_url_2; // Default to existing image_url_2

      // Upload first image if selected
      if (this.selectedImage) {
        const formData = new FormData();
        formData.append("image", this.selectedImage);
        formData.append("id_ingrediente", id);

        const imageResponse = await fetch(`${API_URL}/ingredient_image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!imageResponse.ok) {
          throw new Error(`Image upload failed: ${imageResponse.status}`);
        }

        const imageResult = await imageResponse.json();
        imageUrl = imageResult.image_url; // Get new uploaded image URL
      }

      // Upload second image if selected
      if (this.selectedImage2) {
        const formData = new FormData();
        formData.append("image", this.selectedImage2);
        formData.append("id_ingrediente", id);

        const imageResponse2 = await fetch(`${API_URL}/ingredient_image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!imageResponse2.ok) {
          throw new Error(`Second image upload failed: ${imageResponse2.status}`);
        }

        const imageResult2 = await imageResponse2.json();
        imageUrl2 = imageResult2.image_url; // Get new uploaded second image URL
      }

      // Update ingrediente data
      const updatedData = {
        ...this.ingredienteEditado,
        image_url: imageUrl,
        image_url_2: imageUrl2,
      };

      const response = await fetch(`${API_URL}/ingredientes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error(`Error updating ingrediente: ${response.status}`);
      }

      this.showModal = false;
      location.reload(); // Reload to reflect updated data
    },
  },
  async mounted() {
    // Get the ID from the router
    const id = this.$route.params.id;
    try {
      // Make API call to fetch the platillo data
      const response = await fetch(`${API_URL}/ingrediente/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Store the fetched data in the component's data
      this.ingrediente = data;
      this.ingredienteEditado = { ...data };
    } catch (error) {
      console.error("Error:", error);
    }
    const responseProveedores = await fetch(`${API_URL}/proveedores`);
    if (!responseProveedores.ok) {
      throw new Error(`HTTP error! status: ${responseProveedores.status}`);
    }
    this.proveedores = await responseProveedores.json();
    const responseUnidades = await fetch(`${API_URL}/unidades`);
    if (!responseUnidades.ok) {
      throw new Error(`HTTP error! status: ${responseUnidades.status}`);
    }
    this.unidades = await responseUnidades.json();
  },
};
</script>

<style scoped>
.form-group {
  @apply flex flex-col;
}
</style>