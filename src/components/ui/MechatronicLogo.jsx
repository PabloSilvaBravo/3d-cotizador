import React from 'react';

export const MechatronicLogo = ({ className = '' }) => {
    return (
        <img
            src="/logo.webp"
            alt="MechatronicStore"
            className={`h-14 w-auto ${className}`}
        />
    );
};
