
import type {User, Slot, Event, Settings, OpeningHoursSettings} from './types';
import { addDays, setHours, setMinutes, startOfMonth } from './utils/dateUtils';

const today = new Date();
const startOfCurrentMonth = startOfMonth(today);

export const USERS: User[] = [
  { id: 'user-1', name: 'Alice', role: 'user', template: [
      { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' },
      { dayOfWeek: 3, startTime: '16:00', endTime: '20:00' },
    ] 
  },
  { id: 'user-2', name: 'Bob', role: 'user' },
  { id: 'user-3', name: 'Charlie', role: 'user' },
  { id: 'admin-1', name: 'Admin', role: 'admin' },
];

export const SLOTS: Slot[] = [
  {
    id: 'slot-1',
    userId: 'user-1',
    userName: 'Alice',
    start: setMinutes(setHours(addDays(startOfCurrentMonth, 2), 10), 0).toISOString(),
    end: setMinutes(setHours(addDays(startOfCurrentMonth, 2), 12), 0).toISOString(),
  },
  {
    id: 'slot-2',
    userId: 'user-2',
    userName: 'Bob',
    start: setMinutes(setHours(addDays(startOfCurrentMonth, 5), 14), 0).toISOString(),
    end: setMinutes(setHours(addDays(startOfCurrentMonth, 5), 18), 0).toISOString(),
  },
  {
    id: 'slot-3',
    userId: 'user-1',
    userName: 'Alice',
    start: setMinutes(setHours(addDays(startOfCurrentMonth, 5), 16), 30).toISOString(),
    end: setMinutes(setHours(addDays(startOfCurrentMonth, 5), 20), 0).toISOString(),
  },
];

export const EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Tournoi Interne',
    start: setMinutes(setHours(addDays(startOfCurrentMonth, 10), 9), 0).toISOString(),
    end: setMinutes(setHours(addDays(startOfCurrentMonth, 10), 18), 0).toISOString(),
    allDay: false,
  },
  {
    id: 'event-2',
    title: 'Fermeture exceptionnelle',
    start: addDays(startOfCurrentMonth, 15).toISOString(),
    end: addDays(startOfCurrentMonth, 15).toISOString(),
    allDay: true,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  reminderStartDay: 20,
  minSlotsRequired: 1
};

export const DEFAULT_OPENING_HOURS: OpeningHoursSettings = {
    defaultHours: [
        { dayOfWeek: 0, isOpen: true, start: '09:00', end: '12:30' }, // Sunday
        { dayOfWeek: 1, isOpen: true, start: '09:00', end: '21:00' }, // Monday
        { dayOfWeek: 2, isOpen: true, start: '09:00', end: '21:00' }, // Tuesday
        { dayOfWeek: 3, isOpen: true, start: '09:00', end: '21:00' }, // Wednesday
        { dayOfWeek: 4, isOpen: true, start: '09:00', end: '21:30' }, // Thursday
        { dayOfWeek: 5, isOpen: true, start: '09:00', end: '22:00' }, // Friday
        { dayOfWeek: 6, isOpen: true, start: '09:00', end: '19:00' }, // Saturday
    ],
    specialPeriods: [],
    holidays: [
        { id: `holiday-1`, name: "Jour de l'an", date: '2025-01-01' },
        { id: `holiday-2`, name: 'Noël', date: '2025-12-25' },
    ],
};