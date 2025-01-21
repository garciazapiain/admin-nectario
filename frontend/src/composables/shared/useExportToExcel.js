import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function useExportToExcel() {
  const exportDataToExcel = (data, fileName = "export.xlsx") => {
    try {
      // Create the worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      // Write the workbook and trigger download
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xff;

      // Save the file
      saveAs(new Blob([buf], { type: "application/octet-stream" }), fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

  return { exportDataToExcel };
}
