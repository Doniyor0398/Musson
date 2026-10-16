import { useCollection } from './useCollection';

export function useProducts() {
    const { data, loading, error } = useCollection('products', {
        filterFn: (p) => p.isActive !== false,
    });

    return { products: data, loading, error };
}
