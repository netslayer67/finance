import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileSpreadsheet,
    Upload,
    BarChart3,
    Settings,
    X,
    TrendingUp,
    Building2
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Financial Records', href: '/records', icon: FileSpreadsheet },
    { name: 'Upload Files', href: '/upload', icon: Upload },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Financial Dashboard</h1>
                            <p className="text-xs text-gray-500">IQRA & ICBM</p>
                        </div>
                    </div>

                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href ||
                                (item.href === '/dashboard' && location.pathname === '/');

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => onClose()}
                                    className={clsx(
                                        "sidebar-nav-item",
                                        isActive && "active"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Quick stats section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-primary-900">System Status</span>
                        </div>
                        <p className="text-xs text-primary-700 mt-1">All systems operational</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;