import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { addMonths } from '../utils/dateUtils';
import { BellIcon } from './Icons';

const NotificationBanner: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { currentUser, settings, slots } = context;

  const showNotification = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return false;

    const today = new Date();
    if (today.getDate() < settings.reminderStartDay) return false;

    const nextMonth = addMonths(today, 1);
    const nextMonthYear = nextMonth.getFullYear();
    const nextMonthMonth = nextMonth.getMonth();

    const slotsNextMonth = slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slot.userId === currentUser.id &&
             slotDate.getFullYear() === nextMonthYear &&
             slotDate.getMonth() === nextMonthMonth;
    });

    return slotsNextMonth.length < settings.minSlotsRequired;
  }, [currentUser, settings, slots]);

  if (!showNotification) return null;

  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md mb-6 shadow" role="alert">
      <div className="flex">
        <div className="py-1"><BellIcon className="w-6 h-6 text-amber-500 mr-4"/></div>
        <div>
          <p className="font-bold">Rappel</p>
          <p className="text-sm">Pensez à remplir vos créneaux pour le mois prochain !</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
