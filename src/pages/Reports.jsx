import React, { useState } from 'react';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';
import { useApi } from '../context/ApiContext';
import ChartCard from '../components/dashboard/ChartCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportType, setReportType] = useState('consolidated');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
        organization: ''
    });

    const { getConsolidatedReport, getComparativeReport, getOrganizationSummary } = useApi();

    const generateReport = async () => {
        setLoading(true);
        try {
            let response;
            switch (reportType) {
                case 'consolidated':
                    response = await getConsolidatedReport(dateRange);
                    break;
                case 'comparative':
                    // For comparative reports, you would need two date ranges
                    const { period1Start, period1End, period2Start, period2End } = dateRange;
                    response = await getComparativeReport({
                        period1Start,
                        period1End,
                        period2Start,
                        period2End,
                        organization: dateRange.organization || undefined
                    });
                    break;
                case 'organization':
                    response = await getOrganizationSummary({
                        year: new Date().getFullYear(),
                        organization: dateRange.organization || undefined
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <p className="text-gray-600">
                    Generate comprehensive financial reports and analysis
                </p>
            </div>

            {/* Report Configuration */}
            <div className="card">
                <div className="card-header">
                    <h3 className="text-lg font-medium text-gray-900">Report Configuration</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Organization</label>
                            <select
                                value={dateRange.organization}
                                onChange={(e) => setDateRange({ ...dateRange, organization: e.target.value })}
                                className="form-select"
                            >
                                <option value="">All Organizations</option>
                                <option value="IQRA">IQRA</option>
                                <option value="ICBM">ICBM</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center space-x-4">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <LoadingSpinner size="sm" />
                                    <span>Generating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <BarChart3 className="w-4 h-4" />
                                    <span>Generate Report</span>
                                </div>
                            )}
                        </button>

                        <button className="btn-outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export to Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Results */}
            {reportData && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    {reportData.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="stat-card">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="stat-label">Total Income</p>
                                        <p className="stat-value">{formatCurrency(reportData.summary.totalIncome)}</p>
                                    </div>
                                    <div className="p-3 bg-success-100 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-success-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="stat-label">Total Expenses</p>
                                        <p className="stat-value">{formatCurrency(reportData.summary.totalExpenses)}</p>
                                    </div>
                                    <div className="p-3 bg-danger-100 rounded-lg">
                                        <BarChart3 className="w-6 h-6 text-danger-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="stat-label">Net Income</p>
                                        <p className="stat-value">{formatCurrency(reportData.summary.netIncome)}</p>
                                    </div>
                                    <div className="p-3 bg-primary-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-primary-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="stat-label">Records</p>
                                        <p className="stat-value">{reportData.summary.recordCount}</p>
                                    </div>
                                    <div className="p-3 bg-gray-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-gray-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard
                            title="Financial Trends"
                            data={reportData.data || []}
                            type="line"
                        />

                        <ChartCard
                            title="Organization Comparison"
                            data={reportData.byOrganization || []}
                            type="bar"
                        />
                    </div>

                    {/* Detailed Data Table */}
                    {reportData.records && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="text-lg font-medium text-gray-900">Detailed Records</h3>
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
                                                <tr key={index} className="table-row">
                                                    <td className="table-cell">{record.organization}</td>
                                                    <td className="table-cell">{record.month} {record.year}</td>
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
            )}

            {/* No Report State */}
            {!reportData && !loading && (
                <div className="card">
                    <div className="card-body">
                        <div className="text-center py-12">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No report generated</h3>
                            <p className="text-gray-500">Configure your report parameters and click "Generate Report" to get started</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;