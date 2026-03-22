import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const openAuthModal = () => setAuthModalOpen(true);
    const closeAuthModal = () => setAuthModalOpen(false);

    const signUpWithEmail = async (email, password, name) => {
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            try {
                await updateProfile(res.user, { displayName: name });
                await setDoc(doc(db, 'users', res.user.uid), {
                    uid: res.user.uid,
                    name: name,
                    email: email,
                    createdAt: new Date().toISOString()
                });
            } catch (fsError) {
                console.warn("User created, but Firestore write failed (likely rule issue):", fsError);
            }
            closeAuthModal();
            return { success: true };
        } catch (error) {
            console.error('Sign up error:', error);
            let msg = error.message;
            if (msg.includes('operation-not-allowed')) msg = 'Email/Password auth is disabled in Firebase Console.';
            else if (msg.includes('email-already-in-use')) msg = 'Email is already in use.';
            else msg = msg.replace('Firebase: ', '').replace(/\(auth.*\)\./, '').trim() || msg;
            return { error: msg };
        }
    };

    const signInWithEmail = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeAuthModal();
            return { success: true };
        } catch (error) {
            console.error('Sign in error:', error);
            return { error: error.message.replace('Firebase: ', '').replace(/\(auth.*\)\./, '').trim() || error.message };
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            signUpWithEmail, 
            signInWithEmail, 
            signOut,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
