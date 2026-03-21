import { useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
    collection, doc, addDoc, updateDoc, deleteDoc,
    getDocs, getDoc, query, where, orderBy,
    serverTimestamp,
} from 'firebase/firestore';

// Helper: wrap a promise with a timeout
function withTimeout(promise, ms = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(
                'Request timed out. Please check your Firestore security rules in the Firebase Console. ' +
                'Go to Firebase Console → Firestore Database → Rules, and set: allow read, write: if true;'
            )), ms)
        ),
    ]);
}

/**
 * Hook for Firestore CRUD operations on a collection.
 */
export function useFirestore(collectionName) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async (userId = null) => {
        try {
            setLoading(true);
            setError(null);
            let q;
            if (userId) {
                q = query(
                    collection(db, collectionName),
                    where('createdBy', '==', userId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
            }

            let snapshot;
            try {
                snapshot = await withTimeout(getDocs(q));
            } catch (indexErr) {
                // Possible missing composite index — fallback to simpler query
                console.warn('Query failed, trying fallback:', indexErr.message);
                const fallbackQ = userId
                    ? query(collection(db, collectionName), where('createdBy', '==', userId))
                    : query(collection(db, collectionName));
                snapshot = await withTimeout(getDocs(fallbackQ));
            }

            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setDocuments(docs);
        } catch (err) {
            console.error('Firestore fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [collectionName]);

    const add = useCallback(async (data) => {
        try {
            setError(null);
            const docRef = await withTimeout(addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp(),
            }));
            return docRef.id;
        } catch (err) {
            console.error('Firestore add error:', err);
            setError(err.message);
            throw err;
        }
    }, [collectionName]);

    const update = useCallback(async (docId, data) => {
        try {
            setError(null);
            await withTimeout(updateDoc(doc(db, collectionName, docId), data));
        } catch (err) {
            console.error('Firestore update error:', err);
            setError(err.message);
            throw err;
        }
    }, [collectionName]);

    const remove = useCallback(async (docId) => {
        try {
            setError(null);
            await withTimeout(deleteDoc(doc(db, collectionName, docId)));
        } catch (err) {
            console.error('Firestore delete error:', err);
            setError(err.message);
            throw err;
        }
    }, [collectionName]);

    const getById = useCallback(async (docId) => {
        try {
            setError(null);
            const snap = await withTimeout(getDoc(doc(db, collectionName, docId)));
            if (snap.exists()) return { id: snap.id, ...snap.data() };
            return null;
        } catch (err) {
            console.error('Firestore getById error:', err);
            setError(err.message);
            return null;
        }
    }, [collectionName]);

    return { documents, loading, error, fetchAll, add, update, remove, getById };
}
