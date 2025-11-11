import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { UserCircleIcon } from './Icons';
import { useNavigate, Link } from 'react-router-dom';

const Header: React.FC = () => {
    const context = useContext(AppContext);
    const navigate = useNavigate();
    if (!context) return null;

    const { firebaseUser, currentUser, loginWithGoogle, logout } = context;

    return (
        <header className="bg-brand-primary text-white shadow-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <h1 className="text-xl sm:text-2xl font-bold">Planning Association</h1>

                <nav className="flex items-center space-x-4">
                    {firebaseUser && <>
                        <Link to="/" className="px-3 py-2 rounded-md text-sm hover:bg-sky-600 transition">Calendrier</Link>
                        {currentUser?.role === 'admin' && <Link to="/admin" className="px-3 py-2 rounded-md text-sm hover:bg-sky-600 transition">Admin</Link>}
                    </>}

                    <div className="flex items-center space-x-2">
                        {firebaseUser ? (
                            <>
                                <div className="flex items-center space-x-2">
                                    <UserCircleIcon className="w-6 h-6" />
                                    <span className="font-medium text-sm">{currentUser?.name}</span>
                                </div>
                                <button onClick={logout} className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">Déconnexion</button>
                            </>
                        ) : (
                            <button onClick={loginWithGoogle} className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">Se connecter avec Google</button>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
