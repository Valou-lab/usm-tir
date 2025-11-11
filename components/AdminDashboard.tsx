import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import type { User, Role, Event, Settings, OpeningHoursSettings, WeeklyHoursDay, SpecialPeriod, Holiday } from '../types';
import { addMonths } from '../utils/dateUtils';
import { BellIcon, PencilIcon, PlusIcon, TrashIcon } from './Icons';

// Sub-component for User Management
const UserManagement: React.FC = () => {
    const context = useContext(AppContext);
    const { users, addUser, updateUser, deleteUser } = context!;

    // In a real app, this would be a modal form.
    const handleAddUser = () => {
        const name = prompt("Nom du nouvel utilisateur:");
        const role = prompt("Rôle (user/admin):") as Role;
        if(name && (role === 'user' || role === 'admin')) {
            addUser({ name, role });
        } else {
            alert("Informations invalides.");
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Gestion des Utilisateurs</h3>
            <ul className="space-y-3">
                {users.map(user => (
                    <li key={user.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <div>
                            <p className="font-medium text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                        </div>
                        <div className="space-x-2">
                            <button onClick={() => {
                                const newName = prompt("Nouveau nom:", user.name);
                                if (newName) updateUser({...user, name: newName });
                            }} className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"><PencilIcon className="w-5 h-5"/></button>
                            { user.role !== 'admin' && <button onClick={() => window.confirm(`Supprimer ${user.name}?`) && deleteUser(user.id)} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>}
                        </div>
                    </li>
                ))}
            </ul>
            <button onClick={handleAddUser} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-sky-700">Ajouter un utilisateur</button>
        </div>
    );
};

// Sub-component for Settings
const ApplicationSettings: React.FC = () => {
    const context = useContext(AppContext);
    const { settings, updateSettings } = context!;
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    const handleSave = () => {
        updateSettings(localSettings);
        alert("Paramètres sauvegardés !");
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Paramètres de l'Application</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Jour du 1er rappel (1-28)</label>
                    <input type="number" min="1" max="28" value={localSettings.reminderStartDay} onChange={e => setLocalSettings({...localSettings, reminderStartDay: parseInt(e.target.value)})} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Créneaux obligatoires / mois</label>
                    <input type="number" min="0" value={localSettings.minSlotsRequired} onChange={e => setLocalSettings({...localSettings, minSlotsRequired: parseInt(e.target.value)})} className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
                </div>
            </div>
            <button onClick={handleSave} className="mt-6 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-sky-700">Sauvegarder</button>
        </div>
    );
};

// Sub-component for Event Management
const EventManagement: React.FC = () => {
    const context = useContext(AppContext);
    const { events, addEvent, deleteEvent } = context!;

    const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const date = formData.get('date') as string;
        const allDay = formData.get('allDay') === 'on';

        if (!title || !date) {
            alert("Titre et date sont requis.");
            return;
        }

        const start = new Date(date);
        const end = new Date(date);

        if (!allDay) {
            const startTime = formData.get('startTime') as string;
            const endTime = formData.get('endTime') as string;
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            start.setHours(startHour, startMinute);
            end.setHours(endHour, endMinute);
        }

        addEvent({ title, start: start.toISOString(), end: end.toISOString(), allDay });
        e.currentTarget.reset();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Gérer les Évènements / Fermetures</h3>
            <form onSubmit={handleAddEvent} className="space-y-4 mb-6">
                <input name="title" placeholder="Titre de l'évènement" className="w-full p-2 border border-gray-300 rounded-md" required/>
                <input name="date" type="date" className="w-full p-2 border border-gray-300 rounded-md" required/>
                <div className="flex items-center space-x-4">
                    <input name="startTime" type="time" className="w-full p-2 border border-gray-300 rounded-md" />
                    <span>-</span>
                    <input name="endTime" type="time" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div className="flex items-center">
                    <input id="allDay" name="allDay" type="checkbox" className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"/>
                    <label htmlFor="allDay" className="ml-2 block text-sm text-gray-900">Journée entière</label>
                </div>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Ajouter l'évènement</button>
            </form>
            <h4 className="text-lg font-semibold mb-2 text-gray-600">Évènements à venir</h4>
            <ul className="space-y-2">
                {events.slice().sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map(event => (
                    <li key={event.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                        <div>
                            <p className="font-medium text-gray-800">{event.title}</p>
                            <p className="text-sm text-gray-500">{new Date(event.start).toLocaleDateString('fr-FR', {dateStyle: 'full'})}</p>
                        </div>
                        <button onClick={() => deleteEvent(event.id)} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                    </li>
                ))}
            </ul>
        </div>
    )
}


// Sub-component for Reminder List
const ReminderList: React.FC = () => {
    const context = useContext(AppContext);
    const { users, slots, settings } = context!;

    const reminderList = useMemo(() => {
        const nextMonth = addMonths(new Date(), 1);
        const nextMonthYear = nextMonth.getFullYear();
        const nextMonthMonth = nextMonth.getMonth();

        return users
            .filter(user => user.role === 'user')
            .filter(user => {
                const userSlotsNextMonth = slots.filter(slot => {
                    const slotDate = new Date(slot.start);
                    return slot.userId === user.id &&
                        slotDate.getFullYear() === nextMonthYear &&
                        slotDate.getMonth() === nextMonthMonth;
                }).length;

                return userSlotsNextMonth < settings.minSlotsRequired;
            });
    }, [users, slots, settings]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Liste de Rappel (Mois Prochain)</h3>
            {reminderList.length > 0 ? (
                <ul className="space-y-3">
                    {reminderList.map(user => (
                        <li key={user.id} className="flex justify-between items-center bg-amber-50 p-3 rounded-md">
                            <p className="font-medium text-amber-800">{user.name}</p>
                            <button className="flex items-center px-3 py-1 bg-amber-500 text-white rounded-md text-sm hover:bg-amber-600">
                                <BellIcon className="w-4 h-4 mr-2"/>
                                Envoyer un rappel
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">Tous les utilisateurs ont rempli leurs créneaux pour le mois prochain.</p>
            )}
        </div>
    );
};

const DayHoursEditor: React.FC<{day: WeeklyHoursDay, onUpdate: (field: keyof WeeklyHoursDay, value: any) => void, dayName: string}> = ({day, onUpdate, dayName}) => {
    return (
        <div className="grid grid-cols-4 gap-2 items-center">
            <label className="font-medium text-gray-700">{dayName}</label>
            <div className="flex items-center">
                <input type="checkbox" checked={day.isOpen} onChange={e => onUpdate('isOpen', e.target.checked)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"/>
                <span className="ml-2 text-sm">{day.isOpen ? 'Ouvert' : 'Fermé'}</span>
            </div>
            <input type="time" step="1800" value={day.start} disabled={!day.isOpen} onChange={e => onUpdate('start', e.target.value)} className="p-1 border border-gray-300 rounded-md disabled:bg-gray-100"/>
            <input type="time" step="1800" value={day.end} disabled={!day.isOpen} onChange={e => onUpdate('end', e.target.value)} className="p-1 border border-gray-300 rounded-md disabled:bg-gray-100"/>
        </div>
    )
}

const OpeningHoursManagement: React.FC = () => {
    const context = useContext(AppContext);
    const { openingHours, updateOpeningHours } = context!;
    const [localHours, setLocalHours] = useState<OpeningHoursSettings>(openingHours);
    const [newHoliday, setNewHoliday] = useState({name: '', date: ''});
    const [newPeriod, setNewPeriod] = useState({name: '', start: '', end: ''});

    const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    const handleDefaultHoursChange = (dayOfWeek: number, field: keyof WeeklyHoursDay, value: any) => {
        setLocalHours(prev => ({...prev, defaultHours: prev.defaultHours.map(d => d.dayOfWeek === dayOfWeek ? {...d, [field]: value} : d)}));
    }

    const handlePeriodHoursChange = (periodId: string, dayOfWeek: number, field: keyof WeeklyHoursDay, value: any) => {
        setLocalHours(prev => ({...prev, specialPeriods: prev.specialPeriods.map(p => p.id === periodId ? {...p, hours: p.hours.map(d => d.dayOfWeek === dayOfWeek ? {...d, [field]: value} : d)} : p)}));
    }

    const handleAddPeriod = () => {
        if(!newPeriod.name || !newPeriod.start || !newPeriod.end) {
            alert("Veuillez remplir tous les champs pour la nouvelle période.");
            return;
        }
        const period: SpecialPeriod = {
            id: `period-${Date.now()}`,
            ...newPeriod,
            hours: JSON.parse(JSON.stringify(localHours.defaultHours)) // Deep copy
        }
        setLocalHours(prev => ({...prev, specialPeriods: [...prev.specialPeriods, period]}));
        setNewPeriod({name: '', start: '', end: ''});
    }

    const handleDeletePeriod = (id: string) => {
        setLocalHours(prev => ({...prev, specialPeriods: prev.specialPeriods.filter(p => p.id !== id)}));
    }

    const handleAddHoliday = () => {
        if(!newHoliday.name || !newHoliday.date) {
            alert("Veuillez remplir tous les champs pour le jour férié.");
            return;
        }
        const holiday: Holiday = {
            id: `holiday-${Date.now()}`,
            ...newHoliday
        }
        setLocalHours(prev => ({...prev, holidays: [...prev.holidays, holiday].sort((a, b) => a.date.localeCompare(b.date))}));
        setNewHoliday({name: '', date: ''});
    }

    const handleDeleteHoliday = (id: string) => {
        setLocalHours(prev => ({...prev, holidays: prev.holidays.filter(h => h.id !== id)}));
    }

    const handleSave = () => {
        updateOpeningHours(localHours);
        alert("Horaires d'ouverture sauvegardés !");
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Gestion des Horaires d'Ouverture</h2>
                    <p className="text-gray-500 mt-1">Définissez les horaires pour les mois à venir, les périodes spéciales et les jours de fermeture.</p>
                </div>
                <button onClick={handleSave} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-sky-700 font-semibold">Sauvegarder les Horaires</button>
            </div>

            {/* Default Hours */}
            <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Horaires par Défaut</h3>
                <div className="space-y-2">
                    {localHours.defaultHours.sort((a,b) => a.dayOfWeek === 0 ? 1 : b.dayOfWeek === 0 ? -1 : a.dayOfWeek - b.dayOfWeek) // Sunday last
                        .map(day => <DayHoursEditor key={day.dayOfWeek} day={day} onUpdate={(field, value) => handleDefaultHoursChange(day.dayOfWeek, field, value)} dayName={weekdays[day.dayOfWeek]}/>)}
                </div>
            </div>

            {/* Special Periods */}
            <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Périodes Spéciales (ex: vacances)</h3>
                <div className="space-y-4">
                    {localHours.specialPeriods.map(period => (
                        <div key={period.id} className="bg-sky-50 p-4 rounded-md">
                            <div className="flex justify-between items-center mb-3">
                                <p className="font-bold text-lg text-brand-primary">{period.name} ({new Date(period.start).toLocaleDateString('fr-FR')} - {new Date(period.end).toLocaleDateString('fr-FR')})</p>
                                <button onClick={() => handleDeletePeriod(period.id)} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                            <div className="space-y-2">
                                {period.hours.sort((a,b) => a.dayOfWeek === 0 ? 1 : b.dayOfWeek === 0 ? -1 : a.dayOfWeek - b.dayOfWeek).map(day =>
                                    <DayHoursEditor key={day.dayOfWeek} day={day} onUpdate={(field, value) => handlePeriodHoursChange(period.id, day.dayOfWeek, field, value)} dayName={weekdays[day.dayOfWeek]}/>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex items-end gap-4 bg-gray-50 p-3 rounded-md">
                        <input value={newPeriod.name} onChange={e => setNewPeriod({...newPeriod, name: e.target.value})} placeholder="Nom (ex: Vacances d'été)" className="flex-grow p-2 border border-gray-300 rounded-md"/>
                        <input value={newPeriod.start} onChange={e => setNewPeriod({...newPeriod, start: e.target.value})} type="date" className="p-2 border border-gray-300 rounded-md"/>
                        <input value={newPeriod.end} onChange={e => setNewPeriod({...newPeriod, end: e.target.value})} type="date" className="p-2 border border-gray-300 rounded-md"/>
                        <button onClick={handleAddPeriod} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"><PlusIcon className="w-6 h-6"/></button>
                    </div>
                </div>
            </div>

            {/* Holidays */}
            <div className="border border-gray-200 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Jours Fériés / Fermetures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2">
                        {localHours.holidays.map(holiday => (
                            <li key={holiday.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                <div>
                                    <p className="font-medium text-gray-800">{holiday.name}</p>
                                    <p className="text-sm text-gray-500">{new Date(holiday.date).toLocaleDateString('fr-FR', {dateStyle: 'full'})}</p>
                                </div>
                                <button onClick={() => handleDeleteHoliday(holiday.id)} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-end gap-2 bg-gray-50 p-3 rounded-md">
                        <input value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} placeholder="Nom (ex: 1er Mai)" className="flex-grow p-2 border border-gray-300 rounded-md"/>
                        <input value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} type="date" className="p-2 border border-gray-300 rounded-md"/>
                        <button onClick={handleAddHoliday} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"><PlusIcon className="w-6 h-6"/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">Tableau de Bord Administrateur</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ApplicationSettings />
                <ReminderList />
                <UserManagement />
                <EventManagement />
            </div>
            <OpeningHoursManagement />
        </div>
    );
};

export default AdminDashboard;