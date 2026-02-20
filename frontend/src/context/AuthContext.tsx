import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

interface User {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    daily_calorie_goal?: number;
    current_routine_id?: string;
    current_diet_id?: string; // Added field
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Initialize state from localStorage
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // If we have a token but no user? usually we would fetch /me here.
        // For now assuming we store both on login.
    }, []);

    const login = (newToken: string, newUser: any) => {
        // Normalize user data (snake_case to camelCase if needed)
        const normalizedUser: User = {
            id: String(newUser.id), // Ensure it's a string
            username: newUser.username,
            email: newUser.email,
            profilePicture: newUser.profile_picture || newUser.profilePicture || undefined,
            current_routine_id: newUser.current_routine_id || undefined,
            current_diet_id: newUser.current_diet_id || undefined
        };

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setToken(newToken);
        setUser(normalizedUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;

        // Optimistic Update
        const updatedUser = { ...user, ...updates };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        try {
            // Map camelCase to snake_case for Backend
            const backendUpdates: any = { ...updates };
            if (updates.profilePicture) {
                backendUpdates.profile_picture = updates.profilePicture;
                delete backendUpdates.profilePicture;
            }

            await api.put('/users/me', backendUpdates);
        } catch (error) {
            console.error("Failed to sync user profile", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            login,
            logout,
            updateUser,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
