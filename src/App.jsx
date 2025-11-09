import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import FinancialRecords from './pages/FinancialRecords';
import FileUpload from './pages/FileUpload';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Context
import { SocketProvider } from './context/SocketContext';
import { ApiProvider } from './context/ApiContext';

// Styles
import './index.css';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(process.env.NODE_ENV === 'production'
            ? 'wss://your-production-domain.com'
            : 'http://localhost:5000');

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketProvider socket={socket}>
            <ApiProvider>
                <Router>
                    <div className="flex h-screen bg-gray-50">
                        {/* Sidebar */}
                        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                        {/* Main content */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header */}
                            <Header onMenuClick={() => setSidebarOpen(true)} />

                            {/* Page content */}
                            <main className="flex-1 overflow-y-auto p-6">
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/records" element={<FinancialRecords />} />
                                    <Route path="/upload" element={<FileUpload />} />
                                    <Route path="/reports" element={<Reports />} />
                                    <Route path="/settings" element={<Settings />} />
                                </Routes>
                            </main>
                        </div>
                    </div>

                    {/* Toast notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                            success: {
                                duration: 3000,
                                theme: {
                                    primary: 'green',
                                    secondary: 'black',
                                },
                            },
                        }}
                    />
                </Router>
            </ApiProvider>
        </SocketProvider>
    );
}

export default App;