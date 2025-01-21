import { ref } from "vue";

export default function useDateRange(today = new Date().toISOString().split("T")[0]) {
  const weeks = ref([]);
  const startDate = ref("");
  const endDate = ref("");
  const selectedWeek = ref(null);

  const generateWeeks = () => {
    const weeksArray = [];
    const start = new Date(new Date().getFullYear(), 0, 1);
    while (start.getDay() !== 1) {
      start.setDate(start.getDate() + 1);
    }
    const end = new Date(today);

    while (start <= end) {
      const weekStart = new Date(start);
      const weekEnd = new Date(start);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > end) weekEnd.setDate(end.getDate());

      weeksArray.push({
        value: `${weekStart.toISOString().split("T")[0]}_${weekEnd.toISOString().split("T")[0]}`,
        label: `${weekStart.getDate()} al ${weekEnd.getDate()} de ${weekStart.toLocaleString("es-ES", { month: "long" })}`,
      });

      start.setDate(start.getDate() + 7);
    }

    weeks.value = weeksArray.reverse();
  };

  const updateDateRange = () => {
    if (selectedWeek.value) {
      const [start, end] = selectedWeek.value.split("_");
      startDate.value = start;
      endDate.value = end;
    }
  };

  return { weeks, startDate, endDate, selectedWeek, generateWeeks, updateDateRange };
}
