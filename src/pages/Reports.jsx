import React, { useEffect, useMemo, useState } from 'react';
import {
    BarChart3,
    Download,
    FileText,
    TrendingUp,
    PieChart as PieChartIcon,
    CalendarRange,
    ListChecks
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApi } from '../context/ApiContext';
import ChartCard from '../components/dashboard/ChartCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportType, setReportType] = useState('consolidated');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        organization: '',
        account: '',
        period1Start: '',
        period1End: '',
        period2Start: '',
        period2End: ''
    });
    const [availableCategories, setAvailableCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const {
        getConsolidatedReport,
        getComparativeReport,
        getOrganizationSummary,
        getExpenseCategories,
        getExpenseBreakdown,
        exportConsolidatedReport,
        exportExpenseBreakdown
    } = useApi();

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await getExpenseCategories();
                const categories = response.data?.categories || [];
                setAvailableCategories(categories);
                setSelectedCategories((prev) =>
                    prev.length ? prev : categories.slice(0, 6).map((category) => category.key)
                );
            } catch (error) {
                console.error('Error loading expense categories:', error);
            }
        };

        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setReportData(null);
    }, [reportType]);

    const categoryLabelMap = useMemo(
        () =>
            availableCategories.reduce((acc, category) => {
                acc[category.key] = category.label;
                return acc;
            }, {}),
        [availableCategories]
    );

    const monthChartData = useMemo(() => {
        if (!reportData?.byMonth) return [];
        return Object.entries(reportData.byMonth)
            .map(([period, stats]) => ({
                label: period,
                totalIncome: stats.totalIncome,
                totalExpenses: stats.totalExpenses,
                netIncome: stats.netIncome,
                year: stats.year || 0,
                monthIndex: stats.monthIndex || 0
            }))
            .sort((a, b) => {
                const yearDiff = (a.year || 0) - (b.year || 0);
                if (yearDiff !== 0) return yearDiff;
                return (a.monthIndex || 0) - (b.monthIndex || 0);
            });
    }, [reportData]);

    const organizationChartData = useMemo(() => {
        if (!reportData?.byOrganization) return [];
        return Object.entries(reportData.byOrganization).map(([organization, stats]) => ({
            label: organization,
            totalIncome: stats.totalIncome,
            totalExpenses: stats.totalExpenses,
            netIncome: stats.netIncome
        }));
    }, [reportData]);

    const sortedExpenseBreakdown = useMemo(() => {
        if (!reportData?.breakdown) return [];
        return [...reportData.breakdown].sort((a, b) => b.total - a.total);
    }, [reportData]);

    const formatCurrency = (amount = 0) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0
        }).format(amount || 0);

    const getCategoryLabel = (key) => {
        if (categoryLabelMap[key]) {
            return categoryLabelMap[key];
        }

        return key
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleCategory = (key) => {
        setSelectedCategories((prev) =>
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
        );
    };

    const selectAllCategories = () =>
        setSelectedCategories(availableCategories.map((category) => category.key));

    const clearCategories = () => setSelectedCategories([]);

    const generateReport = async () => {
        try {
            setLoading(true);
            let response;

            switch (reportType) {
                case 'consolidated':
                    response = await getConsolidatedReport({
                        startDate: filters.startDate || undefined,
                        endDate: filters.endDate || undefined,
                        organization: filters.organization || undefined
                    });
                    break;
                case 'comparative':
                    if (!filters.period1Start || !filters.period1End || !filters.period2Start || !filters.period2End) {
                        toast.error('Please provide both date ranges for comparative analysis');
                        return;
                    }
                    response = await getComparativeReport({
                        period1Start: filters.period1Start,
                        period1End: filters.period1End,
                        period2Start: filters.period2Start,
                        period2End: filters.period2End,
                        organization: filters.organization || undefined
                    });
                    break;
                case 'organization':
                    response = await getOrganizationSummary({
                        year: new Date().getFullYear(),
                        organization: filters.organization || undefined
                    });
                    break;
                case 'expenses':
                    if (!filters.startDate || !filters.endDate) {
                        toast.error('Please select a start and end date for the expense breakdown');
                        return;
                    }
                    response = await getExpenseBreakdown({
                        startDate: filters.startDate,
                        endDate: filters.endDate,
                        organization: filters.organization || undefined,
                        account: filters.account || undefined,
                        categories: selectedCategories.length ? selectedCategories.join(',') : undefined
                    });
                    break;
                default:
                    throw new Error('Invalid report type');
            }

            setReportData(response.data);
            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };
    const handleExport = async () => {
        const canExport = reportType === 'consolidated' || reportType === 'expenses';
        if (!canExport) {
            toast('Excel export is available for consolidated and expense breakdown reports.');
            return;
        }

        if (reportType === 'expenses' && (!filters.startDate || !filters.endDate)) {
            toast.error('Select a date range before exporting the expense breakdown');
            return;
        }

        try {
            setExporting(true);
            let blob;

            if (reportType === 'consolidated') {
                blob = await exportConsolidatedReport({
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                    organization: filters.organization || undefined
                });
            } else {
                blob = await exportExpenseBreakdown({
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    organization: filters.organization || undefined,
                    account: filters.account || undefined,
                    categories: selectedCategories.length ? selectedCategories.join(',') : undefined
                });
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `financial-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Report exported to Excel');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const renderExpenseBreakdown = () => {
        if (!reportData) return null;

        const monthlyTotals = reportData.monthlyTotals || [];

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="stat-card">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="stat-label">Total Expenses</p>
                                <p className="stat-value">{formatCurrency(reportData.summary?.totalExpenses)}</p>
                                <p className="text-xs text-gray-500">{reportData.summary?.range?.label}</p>
                            </div>
                            <div className="rounded-full bg-primary-100 p-3">
                                <PieChartIcon className="h-6 w-6 text-primary-600" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="stat-label">Categories Selected</p>
                                <p className="stat-value">{selectedCategories.length || availableCategories.length}</p>
                                <p className="text-xs text-gray-500">
                                    {selectedCategories.length ? 'Custom selection' : 'All categories'}
                                </p>
                            </div>
                            <div className="rounded-full bg-indigo-100 p-3">
                                <ListChecks className="h-6 w-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="stat-label">Records Considered</p>
                                <p className="stat-value">{reportData.summary?.totalRecords || 0}</p>
                                <p className="text-xs text-gray-500">{reportData.summary?.filters?.description}</p>
                            </div>
                            <div className="rounded-full bg-emerald-100 p-3">
                                <CalendarRange className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
                            <p className="text-sm text-gray-500">Ordered by total spend for the selected period</p>
                        </div>
                        <p className="text-xs text-gray-500">
                            Showing {sortedExpenseBreakdown.length} categories
                        </p>
                    </div>
                    <div className="card-body grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sortedExpenseBreakdown.map((category) => (
                            <div key={category.key} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500">Category</p>
                                        <p className="text-sm font-semibold text-gray-900">{category.label}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-primary-600">
                                        {category.percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <p className="mt-3 text-2xl font-bold text-gray-900">{formatCurrency(category.total)}</p>
                                <div className="mt-4">
                                    <div className="h-2 rounded-full bg-white">
                                        <div
                                            className="h-2 rounded-full bg-primary-500 transition-all"
                                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Last month:{' '}
                                        {formatCurrency(
                                            category.monthly?.[category.monthly.length - 1]?.value || 0
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">Monthly Breakdown</h3>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-container">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th>Period</th>
                                        <th>Total Expenses</th>
                                        {selectedCategories.map((category) => (
                                            <th key={category}>{getCategoryLabel(category)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {monthlyTotals.map((month) => (
                                        <tr key={month.period} className="table-row">
                                            <td className="table-cell">{month.period}</td>
                                            <td className="table-cell">{formatCurrency(month.total)}</td>
                                            {selectedCategories.map((category) => (
                                                <td key={`${month.period}-${category}`} className="table-cell">
                                                    {formatCurrency(month.categories?.[category] || 0)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!monthlyTotals.length && (
                                <div className="p-6 text-center text-sm text-gray-500">
                                    No monthly data available for the selected filters.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderStandardReport = () => {
        if (!reportData) return null;

        return (
            <div className="space-y-6">
                {reportData.summary && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="stat-card">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="stat-label">Total Income</p>
                                    <p className="stat-value">{formatCurrency(reportData.summary.totalIncome)}</p>
                                </div>
                                <div className="rounded-full bg-success-100 p-3">
                                    <TrendingUp className="h-6 w-6 text-success-600" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="stat-label">Total Expenses</p>
                                    <p className="stat-value">{formatCurrency(reportData.summary.totalExpenses)}</p>
                                </div>
                                <div className="rounded-full bg-danger-100 p-3">
                                    <BarChart3 className="h-6 w-6 text-danger-600" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="stat-label">Net Income</p>
                                    <p className="stat-value">{formatCurrency(reportData.summary.netIncome)}</p>
                                </div>
                                <div className="rounded-full bg-primary-100 p-3">
                                    <FileText className="h-6 w-6 text-primary-600" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="stat-label">Records</p>
                                    <p className="stat-value">{reportData.summary.recordCount}</p>
                                </div>
                                <div className="rounded-full bg-indigo-100 p-3">
                                    <PieChartIcon className="h-6 w-6 text-indigo-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <ChartCard title="Financial Trends" data={monthChartData} type="line" />
                    <ChartCard title="Organization Comparison" data={organizationChartData} type="bar" />
                </div>

                {reportType === 'consolidated' && reportData.records && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">Detailed Records</h3>
                            <p className="text-sm text-gray-500">Showing the latest 20 records</p>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-container">
                                <table className="table">
                                    <thead className="table-header">
                                        <tr>
                                            <th>Organization</th>
                                            <th>Period</th>
                                            <th>Account</th>
                                            <th>Income</th>
                                            <th>Expenses</th>
                                            <th>Net</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-body">
                                        {reportData.records.slice(0, 20).map((record, index) => (
                                            <tr key={`${record._id || index}`} className="table-row">
                                                <td className="table-cell">{record.organization}</td>
                                                <td className="table-cell">
                                                    {record.month} {record.year}
                                                </td>
                                                <td className="table-cell">{record.account}</td>
                                                <td className="table-cell">{formatCurrency(record.income?.totalIncome)}</td>
                                                <td className="table-cell">{formatCurrency(record.expenses?.totalExpenses)}</td>
                                                <td className="table-cell">
                                                    <span className={record.netIncome >= 0 ? 'text-success-600' : 'text-danger-600'}>
                                                        {formatCurrency(record.netIncome)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const canExport = reportType === 'consolidated' || reportType === 'expenses';
    const isExpenseReport = reportType === 'expenses';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <p className="text-gray-600">Generate consolidated insights, comparative views, and expense drilldowns.</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Report Configuration</h3>
                    <p className="text-sm text-gray-500">
                        Choose the report style, filter by organization/account, then set your desired period.
                    </p>
                </div>
                <div className="card-body space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="form-label">Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="form-select"
                            >
                                <option value="consolidated">Consolidated Report</option>
                                <option value="comparative">Comparative Analysis</option>
                                <option value="organization">Organization Summary</option>
                                <option value="expenses">Expense Breakdown</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Organization</label>
                            <select
                                value={filters.organization}
                                onChange={(e) => handleFilterChange('organization', e.target.value)}
                                className="form-select"
                            >
                                <option value="">All Organizations</option>
                                <option value="IQRA">IQRA</option>
                                <option value="ICBM">ICBM</option>
                            </select>
                        </div>

                        {isExpenseReport && (
                            <div>
                                <label className="form-label">Account</label>
                                <select
                                    value={filters.account}
                                    onChange={(e) => handleFilterChange('account', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">All Accounts</option>
                                    <option value="Ecobank">Ecobank</option>
                                    <option value="NBS Bank">NBS Bank</option>
                                </select>
                            </div>
                        )}

                        {reportType !== 'comparative' && (
                            <>
                                <div>
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    {reportType === 'comparative' && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                                <p className="text-sm font-semibold text-gray-700">Period 1</p>
                                <div className="mt-3 space-y-3">
                                    <input
                                        type="date"
                                        value={filters.period1Start}
                                        onChange={(e) => handleFilterChange('period1Start', e.target.value)}
                                        className="form-input"
                                        placeholder="Start Date"
                                    />
                                    <input
                                        type="date"
                                        value={filters.period1End}
                                        onChange={(e) => handleFilterChange('period1End', e.target.value)}
                                        className="form-input"
                                        placeholder="End Date"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                                <p className="text-sm font-semibold text-gray-700">Period 2</p>
                                <div className="mt-3 space-y-3">
                                    <input
                                        type="date"
                                        value={filters.period2Start}
                                        onChange={(e) => handleFilterChange('period2Start', e.target.value)}
                                        className="form-input"
                                        placeholder="Start Date"
                                    />
                                    <input
                                        type="date"
                                        value={filters.period2End}
                                        onChange={(e) => handleFilterChange('period2End', e.target.value)}
                                        className="form-input"
                                        placeholder="End Date"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {isExpenseReport && (
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="form-label mb-0">Expense Categories</label>
                                <div className="flex items-center gap-4 text-xs font-semibold">
                                    <button
                                        type="button"
                                        className="text-primary-600 hover:text-primary-700"
                                        onClick={selectAllCategories}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        className="text-danger-600 hover:text-danger-700"
                                        onClick={clearCategories}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {availableCategories.map((category) => {
                                    const isActive = selectedCategories.includes(category.key);
                                    return (
                                        <button
                                            key={category.key}
                                            type="button"
                                            onClick={() => toggleCategory(category.key)}
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                isActive
                                                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200'
                                            }`}
                                        >
                                            {category.label}
                                        </button>
                                    );
                                })}
                                {!availableCategories.length && (
                                    <p className="text-sm text-gray-500">Upload financial data to unlock category breakdowns.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                        <button onClick={generateReport} disabled={loading} className="btn-primary">
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <LoadingSpinner size="sm" />
                                    <span>Generating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Generate Report</span>
                                </div>
                            )}
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={!canExport || exporting}
                            className="btn-outline"
                            title={
                                canExport
                                    ? 'Download the current report as an Excel file'
                                    : 'Excel export is available for consolidated and expense reports'
                            }
                        >
                            {exporting ? (
                                <div className="flex items-center space-x-2">
                                    <LoadingSpinner size="sm" />
                                    <span>Preparing Excel...</span>
                                </div>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export to Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex h-64 items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {!loading && reportData && (
                <>
                    {isExpenseReport ? renderExpenseBreakdown() : renderStandardReport()}
                </>
            )}

            {!reportData && !loading && (
                <div className="card">
                    <div className="card-body">
                        <div className="py-12 text-center">
                            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900">No report generated yet</h3>
                            <p className="text-gray-500">Configure your report parameters and click "Generate Report" to get started.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
