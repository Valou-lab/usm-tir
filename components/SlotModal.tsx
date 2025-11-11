import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import type { Slot } from '../types';
import { getOpeningHoursForDate } from '../utils/dateUtils';

interface SlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    slot: Slot | null;
}

const SlotModal: React.FC<SlotModalProps> = ({ isOpen, onClose, date, slot }) => {
    const context = useContext(AppContext);
    const { currentUser, addSlot, updateSlot, openingHours } = context!;

    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    const dailyHours = useMemo(() => {
        const targetDate = date || (slot ? new Date(slot.start) : null);
        if (!targetDate) return null;
        return getOpeningHoursForDate(targetDate, openingHours);
    }, [date, slot, openingHours]);

    const timeOptions = useMemo(() => {
        if (!dailyHours || !dailyHours.isOpen) return [];

        const [startHour, startMinute] = dailyHours.start.split(':').map(Number);
        const [endHour, endMinute] = dailyHours.end.split(':').map(Number);

        const options = [];
        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            options.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);

            currentMinute += 30;
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute -= 60;
            }
        }
        return options;
    }, [dailyHours]);

    const endTimeOptions = useMemo(() => {
        if (!dailyHours || !dailyHours.isOpen) return [];

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const selectedStartTimeInMinutes = startHour * 60 + startMinute;

        const [endHour, endMinute] = dailyHours.end.split(':').map(Number);
        const endTimeInMinutes = endHour * 60 + endMinute;

        const options = [];
        for (let minutes = selectedStartTimeInMinutes + 30; minutes <= endTimeInMinutes; minutes += 30) {
            const hour = Math.floor(minutes / 60);
            const minute = minutes % 60;
            options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
        return options;
    }, [startTime, dailyHours]);

    useEffect(() => {
        if (slot) {
            setStartTime(new Date(slot.start).toTimeString().substring(0, 5));
            setEndTime(new Date(slot.end).toTimeString().substring(0, 5));
        } else if (date && dailyHours?.isOpen && timeOptions.length > 0) {
            setStartTime(timeOptions[0]);
            setEndTime(endTimeOptions[0] || timeOptions[1] || dailyHours.end);
        }
    }, [slot, date, dailyHours, timeOptions, endTimeOptions]);

    useEffect(() => {
        if (startTime && endTimeOptions.length > 0 && !endTimeOptions.includes(endTime)) {
            setEndTime(endTimeOptions[0]);
        }
    }, [startTime, endTime, endTimeOptions]);


    if (!isOpen || (!date && !slot)) return null;

    const targetDateForDisplay = date || new Date(slot!.start);

    if (!dailyHours || !dailyHours.isOpen) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Club fermé</h2>
                    <p className="text-lg mb-6">
                        Le club est fermé le {targetDateForDisplay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.
                    </p>
                    <div className="flex justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Fermer</button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Vous devez être connecté pour ajouter un créneau.");
            return;
        }

        const targetDate = date || new Date(slot!.start);
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        if(startHour * 60 + startMinute >= endHour * 60 + endMinute) {
            alert("L'heure de fin doit être après l'heure de début.");
            return;
        }

        const startDateTime = new Date(targetDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(targetDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        const newSlotData = {
            userId: currentUser.id,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
        };

        if (slot) {
            updateSlot({ ...slot, ...newSlotData });
        } else {
            addSlot(newSlotData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{slot ? 'Modifier le créneau' : 'Ajouter un créneau'}</h2>
                <p className="text-lg mb-4 font-semibold text-brand-primary">
                    { targetDateForDisplay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                            <select
                                id="start-time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                            >
                                {timeOptions.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                            <select
                                id="end-time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                            >
                                {endTimeOptions.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuler</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-sky-700">{slot ? 'Mettre à jour' : 'Ajouter'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SlotModal;