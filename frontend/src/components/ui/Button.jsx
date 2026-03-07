import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`btn btn-${variant} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <span className="spinner"></span> : children}
        </button>
    );
};

export default Button;
