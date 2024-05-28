<template>
  <div class="popup">
    <div class="popup-content">
    <h2>{{ingrediente.nombre}}</h2>
      <h3>
        Demanda para <input type="number" min="1" v-model.number="days" /> días
      </h3>
      <p>Moral: {{ moralDemanda.toFixed(2) }} {{ingrediente.unidad}}</p>
      <p>Campestre: {{ bosquesDemanda.toFixed(2) }} {{ingrediente.unidad}}</p>
      <!-- Add more details as needed -->
    </div>
    <button @click="closePopup">Cerrar</button>
  </div>
</template>

<script>
export default {
  props: {
    ingrediente: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      days: 1,
    };
  },
  computed: {
    moralDemanda() {
      return (this.ingrediente.moral_demanda_semanal * this.days) / 7;
    },
    bosquesDemanda() {
      return (this.ingrediente.bosques_demanda_semanal * this.days) / 7;
    },
  },
  methods: {
    closePopup() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  z-index: 9999;
}

.popup-content > h2, h3,
p {
  color: black;
  padding: 0;
  margin: 0;
}

.popup input {
  width: 2rem;
  font-size: 1.5rem;
  text-align: end;
}

/* Add any other styles as needed */
</style>