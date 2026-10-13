import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
    const isAuthed = sessionStorage.getItem('auth') === 'ok';

    if (!isAuthed) {
        return <Navigate to="/login" replace />;
    }

    return children;
}