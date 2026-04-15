import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { DEFAULT_BSE_HOLIDAYS } from "config/bseHolidays";

const HolidayContext = createContext(null);

export function HolidayProvider({ children }) {
  const [holidays, setHolidays] = useState(DEFAULT_BSE_HOLIDAYS);

  const addHoliday = useCallback((year, date, name) => {
    setHolidays((prev) => {
      const yearHols = [...(prev[year] ?? [])];
      if (yearHols.some((h) => h.date === date)) return prev; // no duplicates
      yearHols.push({ date, name });
      yearHols.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, [year]: yearHols };
    });
  }, []);

  const removeHoliday = useCallback((year, date) => {
    setHolidays((prev) => ({
      ...prev,
      [year]: (prev[year] ?? []).filter((h) => h.date !== date),
    }));
  }, []);

  const getHolidaySet = useCallback(
    (year) => new Set((holidays[year] ?? []).map((h) => h.date)),
    [holidays]
  );

  const value = useMemo(
    () => ({ holidays, addHoliday, removeHoliday, getHolidaySet }),
    [holidays, addHoliday, removeHoliday, getHolidaySet]
  );

  return <HolidayContext.Provider value={value}>{children}</HolidayContext.Provider>;
}

export function useHolidays() {
  return useContext(HolidayContext);
}
