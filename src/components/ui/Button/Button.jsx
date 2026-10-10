import styles from './Button.module.css';

export function Button({
    variant = 'primary',
    fullWidth = false,
    children,
    ...props
}) {
    const className = [
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWidth : '',
    ].join(' ');

    return (
        <button className={className} {...props}>
            {children}
        </button>
    );
}