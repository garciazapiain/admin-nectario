import * as XLSX from "xlsx";
import { ref } from "vue";

export default function useFileUpload() {
  const items = ref([]);

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      items.value = XLSX.utils.sheet_to_json(worksheet, {
        header: ["clavepos", "descripcion", "cantidad"],
      }).slice(1); // Skip the header row
    };
    reader.readAsArrayBuffer(file);
  };

  return { items, parseExcelFile };
}
