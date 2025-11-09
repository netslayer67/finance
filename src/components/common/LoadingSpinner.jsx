import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

const LoadingSpinner = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    return (
        <div className={clsx('flex items-center justify-center', className)}>
            <Loader2 className={clsx('animate-spin', sizeClasses[size])} />
        </div>
    );
};

export default LoadingSpinner;