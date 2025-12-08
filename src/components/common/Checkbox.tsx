import React from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    description?: string;
}

export default function Checkbox({
    label,
    description,
    className = '',
    id,
    ...props
}: CheckboxProps) {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <label htmlFor={inputId} className={`${styles.container} ${className}`}>
            <div className={styles.checkboxWrapper}>
                <input type="checkbox" id={inputId} className={styles.input} {...props} />
                <span className={styles.checkmark}>
                    <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M1 5L4.5 8.5L11 1"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </div>
            {(label || description) && (
                <div className={styles.labelWrapper}>
                    {label && <span className={styles.label}>{label}</span>}
                    {description && <span className={styles.description}>{description}</span>}
                </div>
            )}
        </label>
    );
}
