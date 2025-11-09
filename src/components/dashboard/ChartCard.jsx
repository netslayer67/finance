import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const ChartCard = ({ title, data, type = 'line', height = 300 }) => {
    const formatCurrency = (value = 0) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'MWK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatCompactCurrency = (value = 0) => {
        if (!Number.isFinite(value)) return value;

        const abs = Math.abs(value);
        if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
        if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
        if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
        return `${Math.trunc(value)}`;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const xKey = data && data.length > 0 && data[0].label ? 'label' : '_id.month';
    const chartMargin = type === 'bar'
        ? { top: 20, right: 16, left: 56, bottom: 12 }
        : { top: 16, right: 16, left: 24, bottom: 16 };

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data} margin={chartMargin}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey={xKey}
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                                stroke="#6b7280"
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                width={70}
                                tickMargin={10}
                                stroke="#6b7280"
                                tickFormatter={(val) => `MWK ${formatCompactCurrency(val)}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="totalIncome" fill="#3b82f6" name="Income" />
                            <Bar dataKey="totalExpenses" fill="#ef4444" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][index % 4]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default: // line chart
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={data} margin={chartMargin}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey={xKey}
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                stroke="#6b7280"
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="totalIncome"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                name="Income"
                            />
                            <Line
                                type="monotone"
                                dataKey="totalExpenses"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                name="Expenses"
                            />
                            <Line
                                type="monotone"
                                dataKey="netIncome"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                name="Net Income"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
            <div className="card-body">
                {data && data.length > 0 ? (
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[320px]" style={{ height }}>
                            {renderChart()}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        <div className="text-center">
                            <p className="text-sm">No data available</p>
                            <p className="text-xs mt-1">Upload financial records to see charts</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartCard;
