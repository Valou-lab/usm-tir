import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { auth } from '../firebase';
import {
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
} from 'firebase/auth';

const Login: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return <div>Initialisation...</div>;

    const { loginWithGoogle, loginWithEmail } = context;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isRegister, setIsRegister] = useState(false);
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    // 🔹 Connexion / Inscription Email
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
                // Le AppContext listener créera automatiquement le document Firestore
            } else {
                await loginWithEmail(email, password);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    // 🔹 Réinitialisation du mot de passe
    const handleResetPassword = async () => {
        setError(null);
        setResetMessage(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetMessage('Email de réinitialisation envoyé !');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">{isRegister ? 'Créer un compte' : 'Connexion'}</h2>

            {error && <div className="mb-4 text-red-600">{error}</div>}
            {resetMessage && <div className="mb-4 text-green-600">{resetMessage}</div>}

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border p-2 rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 rounded"
                    required
                />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    {isRegister ? 'Créer mon compte' : 'Se connecter'}
                </button>
            </form>

            {!isRegister && (
                <button
                    onClick={handleResetPassword}
                    className="text-sm text-blue-600 mt-2 hover:underline"
                >
                    Mot de passe oublié ?
                </button>
            )}

            <hr className="my-4" />

            <button
                onClick={loginWithGoogle}
                className="bg-red-600 text-white p-2 rounded w-full hover:bg-red-700"
            >
                Se connecter avec Google
            </button>

            <p className="mt-4 text-center text-sm">
                {isRegister ? 'Vous avez déjà un compte ?' : "Vous n'avez pas de compte ?"}{' '}
                <button
                    className="text-blue-600 hover:underline"
                    onClick={() => { setIsRegister(!isRegister); setError(null); setResetMessage(null); }}
                >
                    {isRegister ? 'Se connecter' : 'Créer un compte'}
                </button>
            </p>
        </div>
    );
};

export default Login;
