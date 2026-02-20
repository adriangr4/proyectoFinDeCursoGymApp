import api from '../api/client';

export interface CreateWorkoutLogData {
    routine_id: string; // Changed from number
    duration_seconds: number;
    calories_burned: number;
    rating: number;
    difficulty: 'easy' | 'medium' | 'hard';
    notes?: string;
    logs: Array<{
        exercise_id: string; // Changed from number
        set_number: number;
        reps: number;
        weight_kg: number;
        notes?: string;
    }>;
}

const HISTORY_CACHE_KEY = 'gymtrack_history_list';

export const getScheduledWorkoutsCache = (): any[] | null => {
    try {
        const cached = localStorage.getItem(HISTORY_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn("Failed to read history cache", e);
    }
    return null;
};

export const getScheduledWorkouts = async (userId?: string): Promise<any[]> => {
    const response = await api.get('/tracking/', {
        params: { user_id: userId }
    });
    try {
        // Only cache if fetching for current user (no userId param or explicit "me")
        if (!userId) {
            localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(response.data));
        }
    } catch (e) {
        console.warn("Failed to save history cache", e);
    }
    return response.data;
};

export const getWorkoutById = async (workoutId: string) => {
    const response = await api.get(`/tracking/${workoutId}`);
    return response.data;
};

// Updated to return WorkoutCompletionResponse
export const logWorkoutSession = async (data: CreateWorkoutLogData) => {
    const response = await api.post('/tracking/log-session', data);
    return response.data;
};
