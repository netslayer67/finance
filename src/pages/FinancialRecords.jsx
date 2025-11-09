import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { useApi } from '../context/ApiContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const FinancialRecords = () => {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        organization: '',
        month: '',
        account: '',
        year: '',
        page: 1,
        limit: 20
    });

    const { getFinancialRecords, deleteFinancialRecord } = useApi();

    useEffect(() => {
        loadRecords();
    }, [filters]);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const response = await getFinancialRecords(filters);
            setRecords(response.data.records);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error loading records:', error);
            toast.error('Failed to load financial records');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await deleteFinancialRecord(id);
                toast.success('Record deleted successfully');
                loadRecords();
            } catch (error) {
                toast.error('Failed to delete record');
            }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Records</h1>
                    <p className="text-gray-600">
                        Manage and view all financial records
                    </p>
                </div>
                <button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="form-label">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search records..."
                                    className="form-input pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Organization</label>
                            <select
                                value={filters.organization}
                                onChange={(e) => setFilters({ ...filters, organization: e.target.value, page: 1 })}
                                className="form-select"
                            >
                                <option value="">All Organizations</option>
                                <option value="IQRA">IQRA</option>
                                <option value="ICBM">ICBM</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Account</label>
                            <select
                                value={filters.account}
                                onChange={(e) => setFilters({ ...filters, account: e.target.value, page: 1 })}
                                className="form-select"
                            >
                                <option value="">All Accounts</option>
                                <option value="Ecobank">Ecobank</option>
                                <option value="NBS Bank">NBS Bank</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Year</label>
                            <select
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
                                className="form-select"
                            >
                                <option value="">All Years</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ organization: '', month: '', account: '', year: '', page: 1, limit: 20 })}
                                className="btn-outline w-full"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Records Table */}
            <div className="card">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                            <p className="text-gray-500">Upload some financial files to get started</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th>Organization</th>
                                        <th>Period</th>
                                        <th>Account</th>
                                        <th>Total Income</th>
                                        <th>Total Expenses</th>
                                        <th>Net Income</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {records.map((record) => (
                                        <tr key={record._id} className="table-row">
                                            <td className="table-cell">
                                                <div className="flex items-center">
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                                    {record.organization}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                {record.month} {record.year}
                                            </td>
                                            <td className="table-cell">{record.account}</td>
                                            <td className="table-cell">
                                                {formatCurrency(record.income?.totalIncome)}
                                            </td>
                                            <td className="table-cell">
                                                {formatCurrency(record.expenses?.totalExpenses)}
                                            </td>
                                            <td className="table-cell">
                                                <span className={record.netIncome >= 0 ? 'text-success-600' : 'text-danger-600'}>
                                                    {formatCurrency(record.netIncome)}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center space-x-2">
                                                    <button className="p-1 text-gray-400 hover:text-primary-600">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record._id)}
                                                        className="p-1 text-gray-400 hover:text-danger-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.total > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.current - 1) * filters.limit) + 1} to {Math.min(pagination.current * filters.limit, pagination.totalRecords)} of {pagination.totalRecords} results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: pagination.current - 1 })}
                                    disabled={pagination.current === 1}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {pagination.current} of {pagination.total}
                                </span>
                                <button
                                    onClick={() => setFilters({ ...filters, page: pagination.current + 1 })}
                                    disabled={pagination.current === pagination.total}
                                    className="btn-outline disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialRecords;