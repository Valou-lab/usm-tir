import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User, Slot, Event, Settings, OpeningHoursSettings } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_OPENING_HOURS } from '../constants';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
    collection, onSnapshot, doc,
    addDoc, updateDoc, deleteDoc, setDoc,
    Timestamp, query, where, getDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface AppContextType {
    users: User[];
    slots: Slot[];
    events: Event[];
    settings: Settings;
    openingHours: OpeningHoursSettings;
    currentUser: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addSlot: (slot: Omit<Slot, 'id' | 'userName'>) => Promise<void>;
    updateSlot: (slot: Slot) => Promise<void>;
    deleteSlot: (slotId: string) => Promise<void>;
    addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
    updateEvent: (event: Event) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
    updateSettings: (settings: Settings) => Promise<void>;
    updateOpeningHours: (settings: OpeningHoursSettings) => Promise<void>;
    applyUserTemplate: (userId: string, targetMonth: Date) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [openingHours, setOpeningHours] = useState<OpeningHoursSettings>(DEFAULT_OPENING_HOURS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // 🔐 Suivi de l'état de connexion Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);

            if (user) {
                // Vérifie si le document utilisateur existe déjà
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    // 🔹 Création automatique du profil Firestore à la première connexion
                    const newUser: User = {
                        id: user.uid,
                        name: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
                        role: 'user',
                    };
                    await setDoc(userRef, newUser);
                    setCurrentUser(newUser);
                } else {
                    setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
                }

                setLoading(false);
            } else {
                // 🔸 Si déconnexion → redirection vers /login
                setCurrentUser(null);
                setLoading(false);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // 🔁 Écoute des collections Firestore (en temps réel)
    useEffect(() => {
        if (!firebaseUser) return; // 🔸 Attendre que l'utilisateur soit connecté
        setLoading(true);

        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(data);
        });

        const unsubSlots = onSnapshot(collection(db, 'slots'), (snap) => {
            const data = snap.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    ...d,
                    start: (d.start as Timestamp).toDate().toISOString(),
                    end: (d.end as Timestamp).toDate().toISOString(),
                } as Slot;
            });
            setSlots(data);
        });

        const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
            const data = snap.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    ...d,
                    start: (d.start as Timestamp).toDate().toISOString(),
                    end: (d.end as Timestamp).toDate().toISOString(),
                } as Event;
            });
            setEvents(data);
        });

        const configRef = doc(db, 'configuration', 'main');
        const unsubConfig = onSnapshot(configRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setSettings(data.settings || DEFAULT_SETTINGS);
                setOpeningHours(data.openingHours || DEFAULT_OPENING_HOURS);
            } else {
                setDoc(configRef, { settings: DEFAULT_SETTINGS, openingHours: DEFAULT_OPENING_HOURS });
            }
        });

        setLoading(false);

        return () => {
            unsubUsers();
            unsubSlots();
            unsubEvents();
            unsubConfig();
        };
    }, [firebaseUser]);

    // 🔧 Fonctions CRUD (inchangées, sauf une légère correction)
    const addUser = async (user: Omit<User, 'id'>) => {
        await addDoc(collection(db, 'users'), user);
    };

    const updateUser = async (updatedUser: User) => {
        const { id, ...data } = updatedUser;
        await setDoc(doc(db, 'users', id), data, { merge: true });
    };

    const deleteUser = async (userId: string) => {
        await deleteDoc(doc(db, 'users', userId));
        const userSlots = slots.filter(s => s.userId === userId);
        for (const slot of userSlots) {
            await deleteDoc(doc(db, 'slots', slot.id));
        }
    };

    const addSlot = async (slot: Omit<Slot, 'id' | 'userName'>) => {
        if (!currentUser) throw new Error("Utilisateur non connecté");
        await addDoc(collection(db, 'slots'), {
            ...slot,
            userId: currentUser.id,
            userName: currentUser.name,
            start: Timestamp.fromDate(new Date(slot.start)),
            end: Timestamp.fromDate(new Date(slot.end)),
        });
    };

    const updateSlot = async (updatedSlot: Slot) => {
        const { id, ...data } = updatedSlot;
        await updateDoc(doc(db, 'slots', id), {
            ...data,
            start: Timestamp.fromDate(new Date(data.start)),
            end: Timestamp.fromDate(new Date(data.end)),
        });
    };

    const deleteSlot = async (slotId: string) => {
        await deleteDoc(doc(db, 'slots', slotId));
    };

    const addEvent = async (event: Omit<Event, 'id'>) => {
        await addDoc(collection(db, 'events'), {
            ...event,
            start: Timestamp.fromDate(new Date(event.start)),
            end: Timestamp.fromDate(new Date(event.end)),
        });
    };

    const updateEvent = async (event: Event) => {
        const { id, ...data } = event;
        await updateDoc(doc(db, 'events', id), {
            ...data,
            start: Timestamp.fromDate(new Date(data.start)),
            end: Timestamp.fromDate(new Date(data.end)),
        });
    };

    const deleteEvent = async (eventId: string) => {
        await deleteDoc(doc(db, 'events', eventId));
    };

    const updateSettings = async (newSettings: Settings) => {
        await setDoc(doc(db, 'configuration', 'main'), { settings: newSettings }, { merge: true });
    };

    const updateOpeningHours = async (newOpeningHours: OpeningHoursSettings) => {
        await setDoc(doc(db, 'configuration', 'main'), { openingHours: newOpeningHours }, { merge: true });
    };

    const applyUserTemplate = async (userId: string, targetMonthDate: Date) => {
        const user = users.find(u => u.id === userId);
        if (!user?.template) return;
        alert("🚧 La logique d'application de template doit être adaptée pour créer des documents Firestore.");
    };

    return (
        <AppContext.Provider value={{
            users, slots, events, settings, openingHours, currentUser, firebaseUser, loading,
            addUser, updateUser, deleteUser,
            addSlot, updateSlot, deleteSlot,
            addEvent, updateEvent, deleteEvent,
            updateSettings, updateOpeningHours, applyUserTemplate
        }}>
            {children}
        </AppContext.Provider>
    );
};
