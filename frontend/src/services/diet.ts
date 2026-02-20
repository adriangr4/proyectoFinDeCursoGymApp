import api from '../api/client';

export interface Diet {
    id: string; // Changed from number
    name: string;
    description?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    image_url?: string;
    meals?: any[]; // Expand if we have a Meal model
    user_id?: string;
}

const DIETS_CACHE_KEY = 'gymtrack_diets_list_v3';

export const getDietsCache = (): Diet[] | null => {
    try {
        const cached = localStorage.getItem(DIETS_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn("Failed to read diets cache", e);
    }
    return null;
};

export const getDiets = async (): Promise<Diet[]> => {
    const response = await api.get<Diet[]>('/diets/');
    try {
        localStorage.setItem(DIETS_CACHE_KEY, JSON.stringify(response.data));
    } catch (e) {
        console.warn("Failed to save diets cache", e);
    }
    return response.data;
};

export const deleteDiet = async (id: string): Promise<void> => {
    await api.delete(`/diets/${id}`);
    localStorage.removeItem(DIETS_CACHE_KEY);
};
