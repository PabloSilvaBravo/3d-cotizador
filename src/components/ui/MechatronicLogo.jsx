import React from 'react';

export const MechatronicLogo = ({ className = '' }) => {
    return (
        <img
            src="/logo.webp"
            alt="MechatronicStore"
            className={`h-11 w-auto ${className}`}
        />
    );
};
