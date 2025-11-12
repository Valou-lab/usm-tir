import React, {useContext, useMemo, useState} from 'react';
import {AppContext} from '../context/AppContext';
import {addMonths, getDay, getMonthName, getOpeningHoursForDate, isSameDay, subMonths} from '../utils/dateUtils';
import type {Event, Slot} from '../types';
import {ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon, WandIcon} from './Icons';
import SlotModal from './SlotModal';
import TemplateModal from './TemplateModal';

const CalendarHeader: React.FC<{
    currentMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onShowTemplateModal: () => void;
}> = ({currentMonth, onPrevMonth, onNextMonth, onShowTemplateModal}) => (
    <div className="flex items-center justify-between mb-6">
        <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600"/>
        </button>
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{getMonthName(currentMonth)}</h2>
            <button onClick={onShowTemplateModal}
                    className="mt-1 inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors">
                <WandIcon className="w-4 h-4 mr-2"/>
                Gérer/Appliquer un template
            </button>
        </div>
        <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <ChevronRightIcon className="w-6 h-6 text-gray-600"/>
        </button>
    </div>
);

interface DayCellProps {
    day: Date;
    slots: Slot[];
    events: Event[];
    onAddSlot: (date: Date) => void;
    onEditSlot: (slot: Slot) => void;
}

const DayCell: React.FC<DayCellProps> = ({ day, slots, events, onAddSlot, onEditSlot }) => {
    const context = useContext(AppContext);
    const { currentUser, deleteSlot, openingHours } = context!;

    const today = new Date();
    const isToday = isSameDay(day, today);

    const dayInfo = getOpeningHoursForDate(day, openingHours);
    const isClosed = !dayInfo.isOpen;
    const isHoliday = dayInfo.reason === 'holiday';
    const isSpecial = dayInfo.reason === 'special';

    const sortedSlots = [...slots].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);

    return (
        <div
            className={`rounded-lg p-3 flex flex-col min-h-[140px] border transition-all duration-300 group
        ${isClosed ? 'bg-gray-100 text-gray-400' : 'bg-white'}
        ${isHoliday ? 'bg-red-50 border-red-300 text-red-700' : ''}
        ${isSpecial ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 hover:border-brand-primary'}
      `}
        >
            {/* Header jour + bouton ajout */}
            <div className="flex justify-between items-center">
        <span className={`font-semibold ${isToday ? 'text-brand-primary' : ''}`}>
          {day.getDate()}
        </span>
                {!isClosed && (
                    <button
                        onClick={() => onAddSlot(day)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-brand-secondary hover:bg-sky-200"
                    >
                        <PlusIcon className="w-5 h-5 text-brand-primary" />
                    </button>
                )}
            </div>

            {/* Info journée */}
            <div className="mt-1 text-xs font-medium italic">
                {isHoliday && 'Jour férié'}
                {isSpecial && dayInfo.label && `Vacances (${dayInfo.label})`}
                {isClosed && !isHoliday && !isSpecial && 'Fermé'}
            </div>

            {/* Slots & events */}
            <div className="mt-2 space-y-1 overflow-y-auto flex-grow">
                {events.map(event => (
                    <div
                        key={event.id}
                        className="text-xs p-1.5 rounded-md bg-red-100 text-red-800 font-medium truncate"
                    >
                        {event.title}
                    </div>
                ))}

                {sortedSlots.map(slot => {
                    const isCurrentUserSlot = slot.userId === currentUser?.id;
                    return (
                        <div
                            key={slot.id}
                            className={`text-xs p-1.5 rounded-md w-full text-left ${
                                isCurrentUserSlot ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            <div className="font-semibold">{slot.userName}</div>
                            <div>
                                {new Date(slot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {new Date(slot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>

                            {isCurrentUserSlot && (
                                <div className="flex items-center justify-end space-x-2 mt-1">
                                    <button onClick={() => onEditSlot(slot)} className="text-blue-600 hover:text-blue-800">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setSlotToDelete(slot)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mini modal de confirmation de suppression */}
            {slotToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-4 rounded shadow-lg max-w-sm w-full">
                        <p className="mb-4">Supprimer ce créneau ?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSlotToDelete(null)}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    deleteSlot(slotToDelete.id);
                                    setSlotToDelete(null);
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CalendarView: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSlotModalOpen, setSlotModalOpen] = useState(false);
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

    const context = useContext(AppContext);

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = Array.from({length: daysInMonth}, (_, i) => new Date(year, month, i + 1));

        const startOffset = getDay(firstDayOfMonth);
        const placeholdersBefore = Array.from({length: startOffset}, () => null);

        return [...placeholdersBefore, ...days];
    }, [currentMonth]);

    if (!context) return <div>Chargement du calendrier...</div>;
    const {slots, events} = context;

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleAddSlot = (date: Date) => {
        setSelectedDate(date);
        setSelectedSlot(null);
        setSlotModalOpen(true);
    };

    const handleEditSlot = (slot: Slot) => {
        setSelectedSlot(slot);
        setSelectedDate(new Date(slot.start));
        setSlotModalOpen(true);
    };

    const weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <CalendarHeader
                currentMonth={currentMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onShowTemplateModal={() => setTemplateModalOpen(true)}
            />

            <div className="grid grid-cols-7 gap-2 text-center font-semibold text-gray-500 text-sm mb-2">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) =>
                    day ? (
                        <DayCell
                            key={day.toISOString()}
                            day={day}
                            slots={slots.filter(slot => isSameDay(new Date(slot.start), day))}
                            events={events.filter(event => isSameDay(new Date(event.start), day))}
                            onAddSlot={handleAddSlot}
                            onEditSlot={handleEditSlot}
                        />
                    ) : (
                        <div key={`placeholder-${index}`} className="bg-gray-50 rounded-lg"></div>
                    )
                )}
            </div>

            {isSlotModalOpen && (
                <SlotModal
                    isOpen={isSlotModalOpen}
                    onClose={() => setSlotModalOpen(false)}
                    date={selectedDate}
                    slot={selectedSlot}
                />
            )}

            {isTemplateModalOpen && (
                <TemplateModal
                    isOpen={isTemplateModalOpen}
                    onClose={() => setTemplateModalOpen(false)}
                    currentDisplayMonth={currentMonth}
                />
            )}
        </div>
    );
};

export default CalendarView;
