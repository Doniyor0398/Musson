import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

const AUTH_LOGIN = import.meta.env.VITE_LOGIN || 'musson';
const AUTH_PASSWORD = import.meta.env.VITE_PASSWORD || 'musson2026';

const norm = (s) => String(s ?? '').trim();

export default function LoginPage() {
    const navigate = useNavigate();
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        const ok =
            norm(login).toLowerCase() === AUTH_LOGIN.toLowerCase() &&
            norm(password) === AUTH_PASSWORD;

        if (ok) {
            sessionStorage.setItem('auth', 'ok');
            navigate('/');
        } else {
            setError('Неверный логин или пароль');
            setPassword('');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>МУССОН</h1>
                    <p>Этикетки для кухни и бара</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="login">Логин</label>
                        <input
                            id="login"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="musson"
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Пароль</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••"
                                autoComplete="current-password"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(prev => !prev)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.error}>{error}</div>

                    <button type="submit" className={styles.submitBtn}>
                        Войти
                    </button>
                </form>
            </div>
        </div>
    );
}