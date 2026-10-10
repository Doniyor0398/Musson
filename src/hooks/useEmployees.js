import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const snapshot = await getDocs(collection(db, 'employees'));
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.isActive !== false);
        setEmployees(data);
      } catch (err) {
        console.error('Ошибка загрузки сотрудников:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { employees, loading, error };
}
