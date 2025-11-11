import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User, Slot, Event, Settings, OpeningHoursSettings } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_OPENING_HOURS } from '../constants';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signOut } from 'firebase/auth';
import {
    collection, onSnapshot, doc,
    addDoc, setDoc, updateDoc, deleteDoc, Timestamp, getDoc
} from 'firebase/firestore';

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
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
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

    // 🔹 Connexion Google
    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        // Le listener onAuthStateChanged prendra le relais pour créer le doc Firestore
    };

    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
        setFirebaseUser(null);
    };

    // 🔐 Gestion Auth et création doc Firestore
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
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
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 🔁 Listeners Firestore
    useEffect(() => {
        setLoading(true);

        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        });

        const unsubSlots = onSnapshot(collection(db, 'slots'), (snap) => {
            setSlots(snap.docs.map(doc => {
                const d = doc.data();
                return { id: doc.id, ...d, start: (d.start as Timestamp).toDate().toISOString(), end: (d.end as Timestamp).toDate().toISOString() } as Slot;
            }));
        });

        const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
            setEvents(snap.docs.map(doc => {
                const d = doc.data();
                return { id: doc.id, ...d, start: (d.start as Timestamp).toDate().toISOString(), end: (d.end as Timestamp).toDate().toISOString() } as Event;
            }));
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
    }, []);

    // 🔧 CRUD functions (inchangées)
    const addUser = async (user: Omit<User, 'id'>) => await addDoc(collection(db, 'users'), user);
    const updateUser = async (u: User) => await setDoc(doc(db, 'users', u.id), u, { merge: true });
    const deleteUser = async (userId: string) => {
        await deleteDoc(doc(db, 'users', userId));
        const userSlots = slots.filter(s => s.userId === userId);
        for (const s of userSlots) await deleteDoc(doc(db, 'slots', s.id));
    };

    const addSlot = async (slot: Omit<Slot, 'id' | 'userName'>) => {
        if (!currentUser) throw new Error('Utilisateur non connecté');
        await addDoc(collection(db, 'slots'), {
            ...slot,
            userId: currentUser.id,
            userName: currentUser.name,
            start: Timestamp.fromDate(new Date(slot.start)),
            end: Timestamp.fromDate(new Date(slot.end)),
        });
    };

    const updateSlot = async (slot: Slot) => {
        const { id, ...data } = slot;
        await updateDoc(doc(db, 'slots', id), {
            ...data,
            start: Timestamp.fromDate(new Date(data.start)),
            end: Timestamp.fromDate(new Date(data.end)),
        });
    };

    const deleteSlot = async (slotId: string) => await deleteDoc(doc(db, 'slots', slotId));
    const addEvent = async (event: Omit<Event, 'id'>) => {
        await addDoc(collection(db, 'events'), { ...event, start: Timestamp.fromDate(new Date(event.start)), end: Timestamp.fromDate(new Date(event.end)) });
    };
    const updateEvent = async (event: Event) => {
        const { id, ...data } = event;
        await updateDoc(doc(db, 'events', id), { ...data, start: Timestamp.fromDate(new Date(data.start)), end: Timestamp.fromDate(new Date(data.end)) });
    };
    const deleteEvent = async (eventId: string) => await deleteDoc(doc(db, 'events', eventId));
    const updateSettings = async (s: Settings) => await setDoc(doc(db, 'configuration', 'main'), { settings: s }, { merge: true });
    const updateOpeningHours = async (h: OpeningHoursSettings) => await setDoc(doc(db, 'configuration', 'main'), { openingHours: h }, { merge: true });
    const applyUserTemplate = (userId: string, targetMonthDate: Date) => { alert('Logic template à adapter'); };

    return (
        <AppContext.Provider value={{
            users, slots, events, settings, openingHours, currentUser, firebaseUser, loading,
            addUser, updateUser, deleteUser,
            addSlot, updateSlot, deleteSlot,
            addEvent, updateEvent, deleteEvent,
            updateSettings, updateOpeningHours, applyUserTemplate,
            loginWithGoogle, logout
        }}>
            {children}
        </AppContext.Provider>
    );
};
