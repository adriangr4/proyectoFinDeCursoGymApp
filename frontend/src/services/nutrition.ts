// New service for nutrition caching

const NUTRITION_CACHE_KEY = 'gymtrack_nutrition_today';

export const getNutritionCache = (): any | null => {
    try {
        const cached = localStorage.getItem(NUTRITION_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn("Failed to read nutrition cache", e);
    }
    return null;
};

export const setNutritionCache = (data: any) => {
    try {
        localStorage.setItem(NUTRITION_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed to write nutrition cache", e);
    }
}
