import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Bell, Shield, Download, Upload } from 'lucide-react';
import { useApi } from '../context/ApiContext';
import { useSocket } from '../context/SocketContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [systemHealth, setSystemHealth] = useState(null);
    const [settings, setSettings] = useState({
        notifications: true,
        autoBackup: true,
        dataRetention: '2years',
        currency: 'MWK',
        timezone: 'Africa/Blantyre'
    });

    const { getSystemHealth } = useApi();
    const { isConnected, socket, connectionAttempts } = useSocket();

    useEffect(() => {
        loadSystemHealth();
    }, []);

    const loadSystemHealth = async () => {
        try {
            setLoading(true);
            const response = await getSystemHealth();
            setSystemHealth(response.data);
        } catch (error) {
            console.error('Error loading system health:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        toast.success('Setting updated');
    };

    const exportData = () => {
        toast.info('Export functionality will be implemented');
    };

    const importData = () => {
        toast.info('Import functionality will be implemented');
    };

    const backupData = () => {
        toast.info('Backup initiated');
    };

    const retryConnection = async () => {
        if (socket) {
            console.log('Manually retrying WebSocket connection...');
            socket.disconnect();
            setTimeout(() => {
                socket.connect();
            }, 1000);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">
                    Configure system settings and preferences
                </p>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <p className="stat-label">System Status</p>
                            <p className={`stat-value ${systemHealth?.status === 'healthy' ? 'text-success-600' : 'text-warning-600'}`}>
                                {systemHealth?.status === 'healthy' ? 'Healthy' : 'Warning'}
                            </p>
                        </div>
                        <div className="p-3 bg-primary-100 rounded-lg">
                            <SettingsIcon className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <p className="stat-label">Database</p>
                            <p className={`stat-value ${systemHealth?.services?.database === 'connected' ? 'text-success-600' : 'text-danger-600'}`}>
                                {systemHealth?.services?.database === 'connected' ? 'Connected' : 'Error'}
                            </p>
                        </div>
                        <div className="p-3 bg-success-100 rounded-lg">
                            <Database className="w-6 h-6 text-success-600" />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <p className="stat-label">WebSocket</p>
                            <p className={`stat-value ${isConnected ? 'text-success-600' : connectionAttempts > 0 ? 'text-warning-600' : 'text-danger-600'}`}>
                                {isConnected ? 'Connected' : connectionAttempts > 0 ? `Retrying (${connectionAttempts})` : 'Disconnected'}
                            </p>
                            {connectionAttempts > 0 && !isConnected && (
                                <p className="text-xs text-warning-600 mt-1">Attempting to reconnect...</p>
                            )}
                        </div>
                        <div className={`p-3 rounded-lg ${isConnected ? 'bg-success-100' : connectionAttempts > 0 ? 'bg-warning-100' : 'bg-danger-100'}`}>
                            <Bell className={`w-6 h-6 ${isConnected ? 'text-success-600' : connectionAttempts > 0 ? 'text-warning-600' : 'text-danger-600'}`} />
                        </div>
                    </div>
                    {!isConnected && connectionAttempts === 0 && (
                        <div className="mt-2">
                            <button
                                onClick={retryConnection}
                                className="text-xs text-primary-600 hover:text-primary-700 underline"
                            >
                                Retry Connection
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                    </div>
                    <div className="card-body space-y-4">
                        <div>
                            <label className="form-label">Default Currency</label>
                            <select
                                value={settings.currency}
                                onChange={(e) => handleSettingChange('currency', e.target.value)}
                                className="form-select"
                            >
                                <option value="MWK">Malawi Kwacha (MWK)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="EUR">Euro (EUR)</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Timezone</label>
                            <select
                                value={settings.timezone}
                                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                                className="form-select"
                            >
                                <option value="Africa/Blantyre">Africa/Blantyre</option>
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">America/New_York</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Data Retention</label>
                            <select
                                value={settings.dataRetention}
                                onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                                className="form-select"
                            >
                                <option value="1year">1 Year</option>
                                <option value="2years">2 Years</option>
                                <option value="5years">5 Years</option>
                                <option value="forever">Forever</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="card-body space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                                <p className="text-xs text-gray-500">Receive email alerts for important events</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notifications ? 'bg-primary-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Auto Backup</p>
                                <p className="text-xs text-gray-500">Automatically backup data daily</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange('autoBackup', !settings.autoBackup)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoBackup ? 'bg-primary-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
                    </div>
                    <div className="card-body space-y-4">
                        <button
                            onClick={exportData}
                            className="btn-outline w-full justify-start"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export All Data
                        </button>

                        <button
                            onClick={importData}
                            className="btn-outline w-full justify-start"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import Data
                        </button>

                        <button
                            onClick={backupData}
                            className="btn-outline w-full justify-start"
                        >
                            <Database className="w-4 h-4 mr-2" />
                            Create Backup
                        </button>
                    </div>
                </div>

                {/* System Information */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">System Information</h3>
                    </div>
                    <div className="card-body space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Version</span>
                            <span className="text-sm font-medium">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Environment</span>
                            <span className="text-sm font-medium">Development</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Uptime</span>
                            <span className="text-sm font-medium">
                                {systemHealth?.metrics?.uptime ?
                                    Math.floor(systemHealth.metrics.uptime / 3600) + 'h ' +
                                    Math.floor((systemHealth.metrics.uptime % 3600) / 60) + 'm' :
                                    'N/A'
                                }
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Memory Usage</span>
                            <span className="text-sm font-medium">
                                {systemHealth?.metrics?.memory ?
                                    Math.round(systemHealth.metrics.memory.heapUsed / 1024 / 1024) + ' MB' :
                                    'N/A'
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-danger-200">
                <div className="card-header">
                    <h3 className="text-lg font-medium text-danger-900">Danger Zone</h3>
                    <p className="text-sm text-danger-700">
                        Irreversible and destructive actions
                    </p>
                </div>
                <div className="card-body">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Reset All Data</h4>
                            <p className="text-xs text-gray-500 mb-2">
                                This will permanently delete all financial records and cannot be undone.
                            </p>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you absolutely sure? This will delete ALL data!')) {
                                        toast.error('This action requires additional confirmation');
                                    }
                                }}
                                className="btn-danger"
                            >
                                Reset All Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;