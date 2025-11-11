
// A simple polyfill for Intl.Locale for environments that may not have it
import {DailyHours, OpeningHoursSettings} from "@/types.ts";

const getLocale = () => {
  try {
    return new Intl.Locale('fr-FR').language;
  } catch (e) {
    return 'fr';
  }
};

export const format = (date: Date, options: Intl.DateTimeFormatOptions): string => {
  return new Intl.DateTimeFormat(getLocale(), options).format(date);
};

export const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

export const getMonthName = (date: Date): string => {
  return format(date, { month: 'long', year: 'numeric' });
};

export const getWeekdays = (): string[] => {
  const weekdays = [];
  const today = new Date();
  const firstDayOfWeek = today.getDate() - today.getDay() + 1; // Start with Monday
  for (let i = 0; i < 7; i++) {
    const day = new Date(today.setDate(firstDayOfWeek + i));
    weekdays.push(format(day, { weekday: 'long' }));
  }
  return weekdays;
};

export const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const subMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() - months);
  return newDate;
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getDay = (date: Date): number => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Monday is 0, Sunday is 6
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const setHours = (date: Date, hours: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(hours);
  return newDate;
};

export const setMinutes = (date: Date, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(minutes);
  return newDate;
};



export const getOpeningHoursForDate = (date: Date, settings: OpeningHoursSettings): DailyHours => {
    const dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
        .toISOString()
        .split("T")[0];

    // 1. Check for holidays
    const holiday = settings.holidays.find(h => h.date === dateString);
    if (holiday) {
        return { isOpen: false, start: '00:00', end: '00:00' };
    }

    // 2. Check for special periods
    const specialPeriod = settings.specialPeriods.find(p => {
        return dateString >= p.start && dateString <= p.end;
    });

    const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, etc.
    if (specialPeriod) {
        const hours = specialPeriod.hours.find(h => h.dayOfWeek === dayOfWeek);
        if (hours) return hours;
    }

    // 3. Fallback to default hours
    const defaultDayHours = settings.defaultHours.find(h => h.dayOfWeek === dayOfWeek);
    // This should always exist if data is correct
    return defaultDayHours!;
};