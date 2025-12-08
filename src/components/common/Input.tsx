import React, { forwardRef, useId } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helper,
            leftIcon,
            rightIcon,
            fullWidth = false,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const inputId = id || generatedId;

        const wrapperClass = [
            styles.wrapper,
            fullWidth ? styles.fullWidth : '',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const inputWrapperClass = [
            styles.inputWrapper,
            error ? styles.hasError : '',
            leftIcon ? styles.hasLeftIcon : '',
            rightIcon ? styles.hasRightIcon : '',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={wrapperClass}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                    </label>
                )}
                <div className={inputWrapperClass}>
                    {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
                    <input ref={ref} id={inputId} className={styles.input} {...props} />
                    {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
                </div>
                {error && <span className={styles.error}>{error}</span>}
                {helper && !error && <span className={styles.helper}>{helper}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
