import { useState, useMemo } from 'react';
import styles from './ProductPicker.module.css';

export function ProductPicker({ products, selectedId, onSelect }) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => p.name.toLowerCase().includes(q));
    }, [products, query]);

    return (
        <div className={styles.wrapper}>
            <input
                className={styles.search}
                type="search"
                placeholder="🔍 Поиск продукта..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
            />

            {filtered.length === 0 ? (
                <div className={styles.empty}>Ничего не найдено</div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            className={`${styles.button} ${selectedId === p.id ? styles.buttonActive : ''}`}
                            onClick={() => onSelect(p.id)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}