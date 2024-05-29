<template>
  <div class="popup">
    <div class="popup-content">
      <h2>Pronóstico demanda - {{ ingrediente.nombre }}</h2>
      <div class="input-group">
        <h3>Numero de dias:</h3>
        <div class="controls">
          <button @click="decrementDays" class="btn">-</button>
          <input type="number" min="1" v-model.number="days" />
          <button @click="incrementDays" class="btn">+</button>
        </div>
      </div>
      <div class="demand">
        <p>
          Moral:
          <span>{{ moralDemanda.toFixed(1) }} {{ ingrediente.unidad }}</span>
        </p>
        <p>
          Campestre:
          <span>{{ bosquesDemanda.toFixed(1) }} {{ ingrediente.unidad }}</span>
        </p>
      </div>
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
    incrementDays() {
      this.days++;
    },
    decrementDays() {
      if (this.days > 1) {
        this.days--;
      }
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
  background-color: #f9f9f9;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  z-index: 9999;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
}

@media screen and (max-width: 768px) {
  .popup {
    width: 80%;
    height: 50%;
  }
}

.popup-content > h2,
h3 {
  color: #333;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.input-group h3 {
  margin-bottom: 10px;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.controls button.btn {
  width: 3rem;
  height: 3rem;
  font-size: 2rem;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #fff;
  cursor: pointer;
  padding: 5px;
  color: black;
  vertical-align: middle;
}

.controls input {
  width: 2rem;
  height: 2rem;
  font-size: 2rem;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 0 10px;
}

.demand p {
  color: #333;
  margin: 0;
}

.demand span {
  font-weight: bold;
}

button {
  display: block;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  margin-top: 20px;
  cursor: pointer;
}

button:hover {
  background-color: #444;
}
</style>