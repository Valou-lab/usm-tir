// A simple polyfill for Intl.Locale for environments that may not have it

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
    return format(date, {month: 'long', year: 'numeric'});
};

export const getWeekdays = (): string[] => {
    const weekdays = [];
    const today = new Date();
    const firstDayOfWeek = today.getDate() - today.getDay() + 1; // Start with Monday
    for (let i = 0; i < 7; i++) {
        const day = new Date(today.setDate(firstDayOfWeek + i));
        weekdays.push(format(day, {weekday: 'long'}));
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

// Détermine si une date est dans une période spéciale (vacances)
export const getSpecialPeriodForDate = (date, specialPeriods) => {
    return specialPeriods.find(period => {
        const start = new Date(period.start);
        const end = new Date(period.end);
        return date >= start && date <= end;
    }) || null;
};

// Retourne les horaires du jour (tenant compte des vacances et jours fériés)
export const getOpeningHoursForDate = (date, openingHours) => {
    const dayOfWeek = date.getDay();
    const {defaultHours, holidays, specialPeriods} = openingHours;

    // Si c’est un jour férié
    const isHoliday = holidays.some(h => isSameDay(new Date(h.date), date));
    if (isHoliday) {
        return {
            isOpen: false,
            reason: "holiday",
        };
    }

    // Vérifie si la date est dans une période spéciale (vacances)
    const specialPeriod = getSpecialPeriodForDate(date, specialPeriods);

    const hoursSource = specialPeriod ? specialPeriod.hours : defaultHours;
    const dailyHours = hoursSource.find(h => h.dayOfWeek === dayOfWeek);

    if (!dailyHours || !dailyHours.isOpen) {
        return {isOpen: false, reason: "closed"};
    }

    return {
        isOpen: true,
        start: dailyHours.start,
        end: dailyHours.end,
        reason: specialPeriod ? "special" : "normal",
        label: specialPeriod?.name || null
    };
};