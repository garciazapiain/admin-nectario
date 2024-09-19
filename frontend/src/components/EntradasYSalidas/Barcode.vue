<template>
    <div>
      <div id="scandit-barcode-picker"></div>
    </div>
  </template>
  
  <script>
  import { BarcodePicker, ScanSettings, configure } from 'scandit-sdk';
  
  export default {
    name: 'BarcodeScanner',
    data() {
      return {
        barcodePicker: null,
      };
    },
    async mounted() {
      // Initialize the Scandit SDK with your license key
      await configure(import.meta.env.VITE_SCANDIT_LICENSE_KEY, {
        engineLocation: 'frontend/node_modules/scandit-sdk/build/',
      });
  
      // Create a BarcodePicker instance and attach it to the DOM element
      this.barcodePicker = await BarcodePicker.create(document.getElementById('scandit-barcode-picker'), {
        playSoundOnScan: true,
        vibrateOnScan: true,
      });
  
      // Define the scan settings
      const scanSettings = new ScanSettings({
        enabledSymbologies: ['ean13', 'qr'],
      });
  
      // Apply the scan settings to the BarcodePicker
      this.barcodePicker.applyScanSettings(scanSettings);
  
      // Add a listener for the scan event
      this.barcodePicker.on('scan', (scanResult) => {
        console.log(scanResult.barcodes[0].data);
        alert(`Scanned: ${scanResult.barcodes[0].data}`);
      });
    },
    beforeDestroy() {
      if (this.barcodePicker) {
        this.barcodePicker.destroy();
      }
    },
  };
  </script>
  
  <style scoped>
  
  #scandit-barcode-picker {
    width: 100%;
    height: 100vh;
  }
  </style>
