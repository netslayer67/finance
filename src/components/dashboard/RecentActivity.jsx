import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

const RecentActivity = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="card-body">
                    <div className="text-center py-8 text-gray-500">
                        <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No recent activity</p>
                        <p className="text-xs mt-1">Upload files or add records to see activity</p>
                    </div>
                </div>
            </div>
        );
    }

    const resolveTimestamp = (activity) => activity.periodStart || activity.createdAt || null;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="card-body">
                <div className="space-y-4">
                    {activities.slice(0, 10).map((activity, index) => {
                        const timestamp = resolveTimestamp(activity);
                        return (
                            <div
                                key={`${activity._id || index}-${activity.periodStart || index}`}
                                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="p-2 rounded-lg bg-gray-100 text-primary-600">
                                    <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {activity.organization} - {activity.periodLabel || `${activity.month} ${activity.year}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {activity.account}
                                        {typeof activity.netIncome === 'number' && (
                                            <span className="ml-1 text-gray-600">
                                                · Net{' '}
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'MWK',
                                                    maximumFractionDigits: 0
                                                }).format(activity.netIncome)}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {timestamp ? (
                                        <>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(timestamp), 'MMM dd, yyyy')}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {format(new Date(timestamp), 'HH:mm')}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400">No timestamp</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {activities.length > 10 && (
                    <div className="mt-4 text-center">
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            View all activity
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
