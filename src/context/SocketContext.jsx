import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children, socket }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);

    useEffect(() => {
        if (!socket) return;

        console.log('Initializing WebSocket connection...');

        // Function to handle connection status
        const updateConnectionStatus = () => {
            const connected = socket.connected;
            setIsConnected(connected);
            console.log('WebSocket connection status:', connected ? 'Connected' : 'Disconnected');
        };

        // Set initial connection status
        updateConnectionStatus();

        // Listen for real-time updates
        socket.on('financial-record-created', (data) => {
            toast.success('New financial record added');
        });

        socket.on('financial-record-updated', (data) => {
            toast.success('Financial record updated');
        });

        socket.on('financial-record-deleted', (data) => {
            toast.success('Financial record deleted');
        });

        socket.on('file-uploaded', (data) => {
            toast.success(`File "${data.fileName}" processed successfully! ${data.recordsProcessed} records added.`);
        });

        // Connection event handlers
        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server');
            setIsConnected(true);
            setConnectionAttempts(0);
            toast.success('Real-time connection established');

            // Test the connection
            socket.emit('test-connection');
        });

        socket.on('connection-confirmed', (data) => {
            console.log('🎉 Connection confirmed by server:', data);
            setIsConnected(true);
        });

        socket.on('test-response', (data) => {
            console.log('✅ Test response received:', data);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from WebSocket server:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                console.log('Attempting to reconnect...');
                setTimeout(() => {
                    if (connectionAttempts < 3) {
                        setConnectionAttempts(prev => prev + 1);
                        socket.connect();
                    }
                }, 2000 * (connectionAttempts + 1));
            }
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);

            if (connectionAttempts < 3) {
                console.log(`Connection attempt ${connectionAttempts + 1} failed, retrying...`);
                setTimeout(() => {
                    setConnectionAttempts(prev => prev + 1);
                    socket.connect();
                }, 3000 * (connectionAttempts + 1));
            } else {
                toast.error('Failed to establish real-time connection');
            }
        });

        // Initial connection attempt
        if (!socket.connected) {
            console.log('Attempting initial connection...');
            socket.connect();
        }

        return () => {
            console.log('Cleaning up WebSocket listeners...');
            socket.off('financial-record-created');
            socket.off('financial-record-updated');
            socket.off('financial-record-deleted');
            socket.off('file-uploaded');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
        };
    }, [socket, connectionAttempts]);

    const value = {
        socket,
        isConnected,
        connectionAttempts
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};