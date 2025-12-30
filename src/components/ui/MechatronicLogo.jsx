import React from 'react';

export const MechatronicLogo = ({ className = '' }) => {
    return (
        <img
            src="/logo.webp"
            alt="MechatronicStore"
            className={`w-auto ${className}`}
        />
    );
};
