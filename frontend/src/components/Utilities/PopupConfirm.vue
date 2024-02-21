<template>
  <div class="popup-confirm">
    <div class="popup-confirm-overlay"></div>
    <div class="popup-confirm-content">
      <div class="popup-confirm-message">{{ confirmMessage }}</div>
      <div class="popup-confirm-buttons">
        <button @click="handleConfirm">OK</button>
        <button @click="handleCancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PopupConfirm',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      confirmMessage: ''
    };
  },
  mounted() {
    this.confirmMessage = 'Confirm ' + this.text;
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm', true);
    },
    handleCancel() {
      this.$emit('confirm', false);
    }
  }
};
</script>

<style scoped>
.popup-confirm {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.popup-confirm-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
}

.popup-confirm-message {
  margin-bottom: 10px;
}

.popup-confirm-buttons {
  display: flex;
  justify-content: flex-end;
}

.popup-confirm-buttons button {
  margin-left: 10px;
}
</style>
