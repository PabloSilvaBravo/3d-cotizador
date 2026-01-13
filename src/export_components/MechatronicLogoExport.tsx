import React from 'react';

interface MechatronicLogoProps {
    className?: string;
}

export const MechatronicLogo: React.FC<MechatronicLogoProps> = ({ className = '' }) => {
    return (
        <img
            src="/logo.webp"
            alt="MechatronicStore"
            className={`h-11 w-auto ${className}`}
        />
    );
};
