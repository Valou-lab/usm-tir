import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User, Slot, Event, Settings, OpeningHoursSettings } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_OPENING_HOURS } from '../constants';
import { auth, db, googleProvider } from '../firebase';
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import {
    collection,
    onSnapshot,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
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
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
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

    // 🔹 Connexion Google
    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
        // Le listener onAuthStateChanged s’occupera de créer/récupérer le doc Firestore
    };

    // 🔹 Connexion Email
    const loginWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    // 🔹 Déconnexion
    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
        setFirebaseUser(null);
    };

    // 🔹 Gestion Auth + utilisateur Firestore
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (!user) {
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            const userRef = doc(db, 'users', user.uid);

            // Écoute en temps réel du document utilisateur
            const unsubscribeUser = onSnapshot(userRef, async (snap) => {
                if (!snap.exists()) {
                    const newUser: User = {
                        id: user.uid,
                        name: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
                        role: 'user', // 🔹 par défaut
                    };
                    await setDoc(userRef, newUser);
                    setCurrentUser(newUser);
                } else {
                    const data = snap.data() as User;
                    // 🔹 Si le champ role n’existe pas, on le met à jour
                    if (!data.role) {
                        await updateDoc(userRef, { role: 'user' });
                        data.role = 'user';
                    }
                    setCurrentUser({ id: snap.id, ...data });
                }
                setLoading(false);
            });

            return () => unsubscribeUser();
        });

        return () => unsubscribeAuth();
    }, []);

    // 🔁 Listeners Firestore globaux
    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {

            setUsers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User)));
        });

        const unsubSlots = onSnapshot(collection(db, 'slots'), (snap) => {
            setSlots(
                snap.docs.map((doc) => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        start: (d.start as Timestamp).toDate().toISOString(),
                        end: (d.end as Timestamp).toDate().toISOString(),
                    } as Slot;
                })
            );
        });

        const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
            setEvents(
                snap.docs.map((doc) => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        start: (d.start as Timestamp).toDate().toISOString(),
                        end: (d.end as Timestamp).toDate().toISOString(),
                    } as Event;
                })
            );
        });

        setLoading(false);

        return () => {
            unsubUsers();
            unsubSlots();
            unsubEvents();
        };
    }, []);

    // 🔧 CRUD
    const addUser = async (user: Omit<User, 'id'>) => await addDoc(collection(db, 'users'), user);
    const updateUser = async (u: User) => await setDoc(doc(db, 'users', u.id), u, { merge: true });
    const deleteUser = async (userId: string) => {
        await deleteDoc(doc(db, 'users', userId));
        const userSlots = slots.filter((s) => s.userId === userId);
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

    const deleteEvent = async (eventId: string) => await deleteDoc(doc(db, 'events', eventId));

    const updateSettings = async (s: Settings) =>
        await setDoc(doc(db, 'configuration', 'main'), { settings: s }, { merge: true });

    const updateOpeningHours = async (h: OpeningHoursSettings) =>
        await setDoc(doc(db, 'configuration', 'main'), { openingHours: h }, { merge: true });

    const applyUserTemplate = (userId: string, targetMonthDate: Date) => {
        alert('Logic template à adapter');
    };

    return (
        <AppContext.Provider
            value={{
                users,
                slots,
                events,
                settings,
                openingHours,
                currentUser,
                firebaseUser,
                loading,
                loginWithGoogle,
                loginWithEmail,
                logout,
                addUser,
                updateUser,
                deleteUser,
                addSlot,
                updateSlot,
                deleteSlot,
                addEvent,
                updateEvent,
                deleteEvent,
                updateSettings,
                updateOpeningHours,
                applyUserTemplate,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
