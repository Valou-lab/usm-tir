
export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  template?: WeeklyTemplate;
}

export interface Slot {
  id: string;
  userId: string;
  userName: string;
  start: string; // ISO string
  end: string; // ISO string
}

export interface Event {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay: boolean;
}

export interface Settings {
  reminderStartDay: number; // Day of the month (1-31)
  minSlotsRequired: number;
}

export interface DailyHours {
    isOpen: boolean;
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
}

export interface WeeklyHoursDay extends DailyHours {
    dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
}

export type WeeklyHours = WeeklyHoursDay[];

export interface SpecialPeriod {
    id: string;
    name: string;
    start: string; // "YYYY-MM-DD"
    end: string;   // "YYYY-MM-DD"
    hours: WeeklyHours;
}

export interface Holiday {
    id: string;
    name: string;
    date: string; // "YYYY-MM-DD"
}

export interface OpeningHoursSettings {
    defaultHours: WeeklyHours;
    specialPeriods: SpecialPeriod[];
    holidays: Holiday[];
}

export interface TemplateDay {
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export type WeeklyTemplate = TemplateDay[];
