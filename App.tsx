import React, { useState, useContext } from 'react';
import CalendarView from './components/CalendarView';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import NotificationBanner from './components/NotificationBanner';
import { AppContext } from './context/AppContext';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'calendar' | 'admin'>('calendar');
    const context = useContext(AppContext);

    if (!context) {
        return <div>Initialisation...</div>;
    }

    const { currentUser, loading, firebaseUser } = context;

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Chargement des données...</div>;
    }

    const handleNavigate = (view: 'calendar' | 'admin') => {
        setCurrentView(view);
    };

    if (!firebaseUser) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header onNavigate={handleNavigate} currentView={currentView} />
                <main className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Bienvenue !</h2>
                    <p>Veuillez vous connecter pour accéder au planning.</p>
                    <p className="text-sm text-gray-500 mt-4">(Dans cette démo, les boutons de connexion sont dans l'en-tête)</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
            <Header onNavigate={handleNavigate} currentView={currentView} />
            <main className="p-4 sm:p-6 lg:p-8">
                <NotificationBanner />
                {currentView === 'calendar' && <CalendarView />}
                {currentView === 'admin' && currentUser?.role === 'admin' && <AdminDashboard />}
                {currentView === 'admin' && currentUser?.role !== 'admin' && (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-bold text-red-600">Accès Refusé</h3>
                        <p className="mt-2 text-gray-600">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;