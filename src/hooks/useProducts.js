import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.isActive !== false);
        setProducts(data);
      } catch (err) {
        console.error('Ошибка загрузки продуктов:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { products, loading, error };
}
