import api from '../api/client';

export interface DashboardStats {
    calories_burned: number;
    calories_target: number;
    time_minutes: number;
    steps: number;
    mission_name: string;
    mission_duration: number;
    mission_img: string;
}

const DASHBOARD_CACHE_KEY = 'gymtrack_dashboard_stats';

export const getDashboardStatsCache = (): DashboardStats | null => {
    try {
        const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn("Failed to read dashboard cache", e);
    }
    return null;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/users/me/dashboard');
    try {
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(response.data));
    } catch (e) {
        console.warn("Failed to save dashboard cache", e);
    }
    return response.data;
};
