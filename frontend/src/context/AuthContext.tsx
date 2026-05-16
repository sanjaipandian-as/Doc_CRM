import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR';
    doctorId?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMe = async () => {
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    logout();
                }
            }
            setLoading(false);
        };
        fetchMe();
    }, [token]);

    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        setUser(data);
        setToken(data.token);
        localStorage.setItem('token', data.token);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
