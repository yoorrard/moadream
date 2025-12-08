import React, { forwardRef } from 'react';
import styles from './Select.module.css';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
    fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            options,
            placeholder,
            fullWidth = false,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

        const wrapperClass = [
            styles.wrapper,
            fullWidth ? styles.fullWidth : '',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const selectWrapperClass = [
            styles.selectWrapper,
            error ? styles.hasError : '',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={wrapperClass}>
                {label && (
                    <label htmlFor={selectId} className={styles.label}>
                        {label}
                    </label>
                )}
                <div className={selectWrapperClass}>
                    <select ref={ref} id={selectId} className={styles.select} {...props}>
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <span className={styles.arrow}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                                d="M3 4.5L6 7.5L9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </div>
                {error && <span className={styles.error}>{error}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
