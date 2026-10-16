import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// Подписка на коллекцию Firestore.
// filterFn — необязательная функция фильтрации на клиенте.
// sortFn   — необязательная функция сортировки.
export function useCollection(name, { filterFn, sortFn } = {}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const ref = collection(db, name);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                if (filterFn) list = list.filter(filterFn);
                if (sortFn) list = [...list].sort(sortFn);
                setData(list);
                setLoading(false);
            },
            (err) => {
                console.error(`[useCollection:${name}]`, err);
                setError(err.message);
                setLoading(false);
            },
        );

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name]);

    return { data, loading, error };
}
