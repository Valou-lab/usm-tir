import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CalendarView from './components/CalendarView';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import NotificationBanner from './components/NotificationBanner';
import { AppContext } from './context/AppContext';

const App: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) {
        return <div>Initialisation du contexte...</div>;
    }

    const { currentUser, firebaseUser, loading } = context;

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-700">Chargement des données...</div>;
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
                <Header />
                <main className="p-4 sm:p-6 lg:p-8">
                    <NotificationBanner />

                    <Routes>
                        {/* Page de connexion / déconnexion */}
                        {!firebaseUser && (
                            <Route
                                path="*"
                                element={
                                    <div className="text-center p-10">
                                        <h2 className="text-2xl font-bold mb-4">Bienvenue 👋</h2>
                                        <p>Veuillez vous connecter pour accéder au planning.</p>
                                        <p className="text-sm text-gray-500 mt-4">(Utilisez les boutons de connexion dans l'en-tête)</p>
                                    </div>
                                }
                            />
                        )}

                        {/* Utilisateur connecté */}
                        {firebaseUser && (
                            <>
                                <Route path="/" element={<CalendarView />} />

                                <Route
                                    path="/admin"
                                    element={
                                        currentUser?.role === 'admin' ? (
                                            <AdminDashboard />
                                        ) : (
                                            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                                                <h3 className="text-xl font-bold text-red-600">Accès refusé 🚫</h3>
                                                <p className="mt-2 text-gray-600">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
                                            </div>
                                        )
                                    }
                                />

                                {/* Par défaut, on redirige vers le calendrier */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </>
                        )}
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
