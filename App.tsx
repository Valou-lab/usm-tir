import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CalendarView from './components/CalendarView';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import NotificationBanner from './components/NotificationBanner';
import { AppContext } from './context/AppContext';

const App: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return <div>Initialisation...</div>;
    const { firebaseUser, currentUser, loading } = context;

    if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;

    return (
        <Router>
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
                <NotificationBanner />
                <Routes>
                    {!firebaseUser && <Route path="*" element={<div className="text-center mt-20">Veuillez vous connecter via Google</div>} />}
                    {firebaseUser && <>
                        <Route path="/" element={<CalendarView />} />
                        <Route path="/admin" element={currentUser?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>}
                </Routes>
            </main>
        </Router>
    );
};

export default App;
