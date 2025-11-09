import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileSpreadsheet,
    Building2,
    Activity,
    Calendar,
    BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApi } from '../context/ApiContext';
import { useSocket } from '../context/SocketContext';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import LoadingSpinner from '../components/common/LoadingSpinner';

const defaultStats = {
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    recordCount: 0,
    totalClosingBalance: 0,
    avgClosingBalance: 0
};

const defaultTrends = {
    income: { current: 0, previous: 0, change: 0, trend: 'neutral' },
    expenses: { current: 0, previous: 0, change: 0, trend: 'neutral' },
    netIncome: { current: 0, previous: 0, change: 0, trend: 'neutral' }
};

const formatCurrency = (amount = 0) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'MWK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);

const formatDate = (date, options = { month: 'short', year: 'numeric' }) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', options);
};

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        overview: null,
        charts: {
            trend: null,
            organization: null
        },
        stats: null
    });
    const [timeframe, setTimeframe] = useState('30d');
    const [organization, setOrganization] = useState('');

    const {
        getDashboardOverview,
        getDashboardCharts,
        getDashboardStats
    } = useApi();
    const { socket, isConnected } = useSocket();

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            const [overviewRes, trendChartRes, organizationChartRes, statsRes] = await Promise.all([
                getDashboardOverview({ timeframe, organization: organization || undefined }),
                getDashboardCharts({
                    chartType: 'monthly-trend',
                    timeframe: timeframe === 'all' ? '2y' : '1y',
                    organization: organization || undefined
                }),
                getDashboardCharts({
                    chartType: 'organization-comparison',
                    timeframe: timeframe === 'all' ? 'all' : '1y',
                    organization: organization || undefined
                }),
                getDashboardStats()
            ]);

            setData({
                overview: overviewRes.data,
                charts: {
                    trend: trendChartRes.data,
                    organization: organizationChartRes.data
                },
                stats: statsRes.data
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [timeframe, organization, getDashboardOverview, getDashboardCharts, getDashboardStats]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    useEffect(() => {
        if (!socket) return;

        const refreshEvents = ['financial-record-created', 'financial-record-updated', 'financial-record-deleted', 'file-uploaded'];
        const handleRefresh = () => loadDashboardData();

        refreshEvents.forEach((event) => socket.on(event, handleRefresh));

        return () => {
            refreshEvents.forEach((event) => socket.off(event, handleRefresh));
        };
    }, [socket, loadDashboardData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const overview = data.overview || {};
    const current = overview.current || defaultStats;
    const trends = overview.trends || defaultTrends;
    const recentActivity = overview.recentActivity || [];
    const cumulative = overview.cumulative || {
        lifetime: defaultStats,
        yearToDate: defaultStats,
        organizations: [],
        accounts: []
    };
    const coverage = overview.coverage;
    const range = overview.range;

    const mostRecentActivity = recentActivity[0];
    const lastUpdateDate = mostRecentActivity?.periodStart || mostRecentActivity?.createdAt;

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                    <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Financial Dashboard</p>
                    <h1 className="text-2xl font-bold text-gray-900">Consolidated performance overview</h1>
                    <p className="text-gray-600 text-sm">
                        Monitor IQRA &amp; ICBM cashflow, balances, and organization performance in one view.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <select
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="form-select w-full sm:w-48"
                        aria-label="Organization filter"
                    >
                        <option value="">All Organizations</option>
                        <option value="IQRA">IQRA</option>
                        <option value="ICBM">ICBM</option>
                    </select>
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="form-select w-full sm:w-48"
                        aria-label="Timeframe filter"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Current year</option>
                        <option value="all">All time</option>
                    </select>
                </div>
            </div>

            {/* Timeframe stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    title="Total Income"
                    value={formatCurrency(current.totalIncome)}
                    change={trends.income.change}
                    trend={trends.income.trend}
                    icon={TrendingUp}
                    color="success"
                />
                <StatCard
                    title="Total Expenses"
                    value={formatCurrency(current.totalExpenses)}
                    change={trends.expenses.change}
                    trend={trends.expenses.trend}
                    icon={TrendingDown}
                    color="warning"
                />
                <StatCard
                    title="Net Income"
                    value={formatCurrency(current.netIncome)}
                    change={trends.netIncome.change}
                    trend={trends.netIncome.trend}
                    icon={DollarSign}
                    color="primary"
                />
                <StatCard
                    title="Records"
                    value={current.recordCount.toString()}
                    change={undefined}
                    trend="neutral"
                    icon={FileSpreadsheet}
                    color="gray"
                />
            </div>

            {/* Lifetime snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                <StatCard
                    title="Lifetime Income"
                    value={formatCurrency(cumulative.lifetime.totalIncome)}
                    icon={TrendingUp}
                    color="primary"
                    subtitle={`${cumulative.organizations?.length || 0} organization${(cumulative.organizations?.length || 0) !== 1 ? 's' : ''}`}
                />
                <StatCard
                    title="Lifetime Net"
                    value={formatCurrency(cumulative.lifetime.netIncome)}
                    icon={DollarSign}
                    color="success"
                    subtitle={`${cumulative.accounts?.length || 0} account${(cumulative.accounts?.length || 0) !== 1 ? 's' : ''}`}
                />
                <StatCard
                    title="Year-to-date Income"
                    value={formatCurrency(cumulative.yearToDate.totalIncome)}
                    icon={Calendar}
                    color="warning"
                    subtitle={`Year ${new Date().getFullYear()}`}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                <ChartCard
                    title="Income vs Expenses Trend"
                    data={data.charts?.trend?.data || []}
                    type="line"
                />
                <ChartCard
                    title="Organization Comparison"
                    data={data.charts?.organization?.data || []}
                    type="bar"
                />
            </div>

            {/* Coverage + status */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                <div className="card h-full">
                    <div className="card-header flex items-center justify-between gap-3">
                        <h3 className="text-lg font-medium text-gray-900">Data Coverage</h3>
                        <BarChart3 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="card-body text-sm text-gray-600 space-y-3 leading-relaxed">
                        <p>
                            Dataset spans{' '}
                            <span className="font-semibold">
                                {formatDate(coverage?.firstPeriod)} - {formatDate(coverage?.lastPeriod)}
                            </span>
                        </p>
                        <p>Total unique months tracked: <span className="font-semibold">{coverage?.monthsCovered || 0}</span></p>
                        {range && (
                            <p>
                                Current view: {formatDate(range.start, { month: 'short', day: 'numeric', year: 'numeric' })} -{' '}
                                {formatDate(range.end, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                </div>

                <div className="card h-full">
                    <div className="card-body flex items-center justify-between gap-4">
                        <div>
                            <p className="stat-label uppercase tracking-wide text-xs">Realtime Status</p>
                            <p className={`text-lg font-semibold ${isConnected ? 'text-success-600' : 'text-danger-600'}`}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </p>
                            <p className="text-xs text-gray-500">Socket.IO live updates</p>
                        </div>
                        <div className={`p-3 rounded-lg ${isConnected ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'}`}>
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="card h-full">
                    <div className="card-body flex items-center justify-between gap-4">
                        <div>
                            <p className="stat-label uppercase tracking-wide text-xs">Last Update</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {lastUpdateDate ? formatDate(lastUpdateDate, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No recent activity'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {recentActivity.length > 0 ? `Latest period: ${recentActivity[0].periodLabel || ''}` : 'Waiting for uploads'}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">Organization Breakdown</h3>
                    </div>
                    <div className="card-body">
                        {cumulative.organizations && cumulative.organizations.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 uppercase text-xs">
                                            <th className="py-2">Organization</th>
                                            <th className="py-2">Income</th>
                                            <th className="py-2">Expenses</th>
                                            <th className="py-2">Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-800">
                                        {cumulative.organizations.map((org) => (
                                            <tr key={org._id} className="border-t border-gray-100">
                                                <td className="py-2">{org._id}</td>
                                                <td className="py-2">{formatCurrency(org.totalIncome)}</td>
                                                <td className="py-2">{formatCurrency(org.totalExpenses)}</td>
                                                <td className="py-2">{formatCurrency(org.netIncome)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Upload data to see organization insights.</p>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">Account Breakdown</h3>
                    </div>
                    <div className="card-body">
                        {cumulative.accounts && cumulative.accounts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 uppercase text-xs">
                                            <th className="py-2">Account</th>
                                            <th className="py-2">Income</th>
                                            <th className="py-2">Expenses</th>
                                            <th className="py-2">Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-800">
                                        {cumulative.accounts.map((accountRow) => (
                                            <tr key={accountRow._id} className="border-t border-gray-100">
                                                <td className="py-2">{accountRow._id}</td>
                                                <td className="py-2">{formatCurrency(accountRow.totalIncome)}</td>
                                                <td className="py-2">{formatCurrency(accountRow.totalExpenses)}</td>
                                                <td className="py-2">{formatCurrency(accountRow.netIncome)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Upload data to see account insights.</p>
                        )}
                    </div>
                </div>
            </div>

            <RecentActivity activities={recentActivity} />
        </div>
    );
};

export default Dashboard;
