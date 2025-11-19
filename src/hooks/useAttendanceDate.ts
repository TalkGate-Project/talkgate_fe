import { useState } from "react";

export function useAttendanceDate(initialDate?: string) {
  const [date, setDate] = useState(
    initialDate || (() => new Date().toISOString().split("T")[0])
  );

  const navigateDate = (direction: "prev" | "next") => {
    const d = new Date(date);
    if (direction === "prev") {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() + 1);
    }
    const newDate = d.toISOString().split("T")[0];
    setDate(newDate);
    return newDate;
  };

  return {
    date,
    setDate,
    navigateDate,
  };
}

