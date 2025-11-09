import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

const StatCard = ({
    title,
    value,
    change,
    trend,
    icon: Icon,
    color = 'primary',
    subtitle
}) => {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4" />;
            case 'down':
                return <TrendingDown className="w-4 h-4" />;
            default:
                return <Minus className="w-4 h-4" />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'stat-change positive';
            case 'down':
                return 'stat-change negative';
            default:
                return 'stat-change';
        }
    };

    const getIconBgColor = () => {
        switch (color) {
            case 'success':
                return 'bg-success-100 text-success-600';
            case 'warning':
                return 'bg-warning-100 text-warning-600';
            case 'danger':
                return 'bg-danger-100 text-danger-600';
            case 'gray':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-primary-100 text-primary-600';
        }
    };

    return (
        <div className="stat-card">
            <div className="flex items-center">
                <div className="flex-1">
                    <p className="stat-label">{title}</p>
                    <p className="stat-value mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {change !== undefined && change !== 0 && (
                        <div className={clsx('flex items-center mt-2', getTrendColor())}>
                            {getTrendIcon()}
                            <span className="ml-1 text-sm font-medium">
                                {Math.abs(change).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                <div className={clsx('p-3 rounded-lg', getIconBgColor())}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

export default StatCard;