import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { UserCircleIcon } from './Icons';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

interface HeaderProps {
    onNavigate: (view: 'calendar' | 'admin') => void;
    currentView: 'calendar' | 'admin';
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { currentUser } = context;

    // Fonctions de connexion/déconnexion pour la démo.
    // Dans une vraie application, vous auriez un formulaire de connexion.
    // Assurez-vous d'avoir créé ces utilisateurs dans la console Firebase Auth.
    const handleLoginAsUser = () => {
        signInWithEmailAndPassword(auth, 'user@example.com', 'password').catch(error => alert(error.message));
    };

    const handleLoginAsAdmin = () => {
        signInWithEmailAndPassword(auth, 'admin@example.com', 'password').catch(error => alert(error.message));
    };

    const handleLogout = () => {
        signOut(auth);
        onNavigate('calendar');
    };

    return (
        <header className="bg-brand-primary text-white shadow-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <h1 className="text-xl sm:text-2xl font-bold">Planning Association</h1>

                    <nav className="flex items-center space-x-4">
                        {currentUser && (
                            <>
                                <button
                                    onClick={() => onNavigate('calendar')}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'calendar' ? 'bg-white text-brand-primary' : 'hover:bg-sky-600'}`}>
                                    Calendrier
                                </button>
                                {currentUser?.role === 'admin' && (
                                    <button
                                        onClick={() => onNavigate('admin')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-white text-brand-primary' : 'hover:bg-sky-600'}`}>
                                        Admin
                                    </button>
                                )}
                            </>
                        )}

                        <div className="flex items-center space-x-2">
                            {currentUser ? (
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                        <UserCircleIcon className="w-6 h-6" />
                                        <span className="font-medium text-sm">{currentUser.name}</span>
                                    </div>
                                    <button onClick={handleLogout} className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">
                                        Déconnexion
                                    </button>
                                </div>
                            ) : (
                                <div className="space-x-2">
                                    <button onClick={handleLoginAsUser} className="px-3 py-1.5 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700">Login User</button>
                                    <button onClick={handleLoginAsAdmin} className="px-3 py-1.5 bg-amber-500 text-white rounded-md text-sm hover:bg-amber-600">Login Admin</button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;