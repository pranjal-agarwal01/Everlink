import React from 'react';

const Input = ({ label, id, error, ...props }) => {
    return (
        <div className="form-group">
            {label && <label htmlFor={id} className="form-label">{label}</label>}
            <input
                id={id}
                className="form-input"
                {...props}
            />
            {error && <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
        </div>
    );
};

export default Input;
