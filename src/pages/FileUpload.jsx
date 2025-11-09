import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useApi } from '../context/ApiContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FileUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [organization, setOrganization] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    const { uploadFile, getUploadHistory } = useApi();
    const { socket } = useSocket();

    // File dropzone configuration
    const onDrop = useCallback((acceptedFiles) => {
        setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: true
    });

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        setSelectedFiles([]);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select at least one file');
            return;
        }

        if (selectedFiles.some(file => !organization || !month || !year)) {
            toast.error('Please fill in organization, month, and year for all files');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('organization', organization);
                formData.append('month', month);
                formData.append('year', year);
                formData.append('uploadedBy', 'Admin User');

                const response = await uploadFile(formData, (progress) => {
                    const fileProgress = (i / selectedFiles.length) * 100 + (progress / selectedFiles.length);
                    setUploadProgress(Math.round(fileProgress));
                });

                setUploadedFiles(prev => [...prev, {
                    id: response.data.fileUpload.id,
                    name: file.name,
                    status: 'success',
                    records: response.data.fileUpload.recordsProcessed,
                    period: response.data.period,
                    sheets: response.data.sheets,
                    totals: response.data.totals
                }]);

                toast.success(`File "${file.name}" uploaded successfully!`);
            }

            // Clear selected files after successful upload
            clearAllFiles();
            setUploadProgress(0);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    // Listen for real-time upload updates
    React.useEffect(() => {
        if (!socket) return;

        socket.on('file-uploaded', (data) => {
            setUploadedFiles(prev => {
                const updated = [...prev];
                const index = updated.findIndex(f => f.name === data.fileName);
                if (index !== -1) {
                    updated[index] = {
                        ...updated[index],
                        status: 'success',
                        records: data.recordsProcessed,
                        period: data.period || updated[index].period
                    };
                }
                return updated;
            });
        });

        return () => {
            socket.off('file-uploaded');
        };
    }, [socket]);

    const months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Financial Records</h1>
                <p className="text-gray-600">
                    Upload Excel files containing IQRA and ICBM financial data
                </p>
            </div>

            {/* Upload Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* File Upload Area */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">Select Files</h3>
                            <p className="text-sm text-gray-500">
                                Drop your Excel files here or click to browse
                            </p>
                        </div>
                        <div className="card-body">
                            <div
                                {...getRootProps()}
                                className={`upload-area ${isDragActive ? 'active' : ''} ${fileRejections.length > 0 ? 'reject' : ''}`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium text-gray-700">
                                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    or click to browse files
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Supports .xlsx and .xls files (max 10MB each)
                                </p>
                            </div>

                            {/* Selected Files */}
                            {selectedFiles.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            Selected Files ({selectedFiles.length})
                                        </h4>
                                        <button
                                            onClick={clearAllFiles}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Clear all
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                    disabled={uploading}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Uploading...</span>
                                        <span className="text-sm text-gray-500">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Upload Button */}
                            <div className="mt-6">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || selectedFiles.length === 0}
                                    className="btn-primary w-full"
                                >
                                    {uploading ? (
                                        <div className="flex items-center space-x-2">
                                            <LoadingSpinner size="sm" />
                                            <span>Uploading...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Upload className="w-4 h-4" />
                                            <span>Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metadata Form */}
                <div>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-lg font-medium text-gray-900">File Information</h3>
                        </div>
                        <div className="card-body space-y-4">
                            <div>
                                <label className="form-label">Organization</label>
                                <select
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    className="form-select"
                                    disabled={uploading}
                                >
                                    <option value="">Select Organization</option>
                                    <option value="IQRA">IQRA</option>
                                    <option value="ICBM">ICBM</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Month</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="form-select"
                                    disabled={uploading}
                                >
                                    <option value="">Select Month</option>
                                    {months.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Year</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="form-select"
                                    disabled={uploading}
                                >
                                    <option value="">Select Year</option>
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* File Format Help */}
                            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-900">File Format</h4>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Use names like "Iqraa income & expense-JAN 25.xlsx". IQRA/ICBM sheet names are auto-detected, but selecting metadata ensures accuracy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Uploads */}
            {uploadedFiles.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="text-lg font-medium text-gray-900">Recent Uploads</h3>
                    </div>
                    <div className="card-body">
                        <div className="space-y-3">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {file.period ? `${file.period.month} ${file.period.year}` : 'Period auto-detected'}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center text-xs text-green-600 font-medium">
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Processed
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {file.records} record{file.records !== 1 ? 's' : ''} saved to the database
                                    </p>

                                    {file.sheets && file.sheets.length > 0 && (
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 mb-1">Sheets</p>
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                {file.sheets.map((sheet, sheetIndex) => (
                                                    <li key={`${file.id || index}-${sheet.sheetName || sheetIndex}`} className="flex items-center justify-between">
                                                        <span>
                                                            {sheet.sheetName || 'Unnamed sheet'}
                                                            {sheet.organization ? ` (${sheet.organization})` : ''}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {sheet.accounts && sheet.accounts.length ? sheet.accounts.join(', ') : 'No accounts'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {file.totals && (
                                        <div className="text-xs text-gray-500">
                                            <p>Organizations: {file.totals.organizations?.length ? file.totals.organizations.join(', ') : '—'}</p>
                                            <p>Accounts: {file.totals.accountsCount || file.totals.accounts?.length || 0}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
