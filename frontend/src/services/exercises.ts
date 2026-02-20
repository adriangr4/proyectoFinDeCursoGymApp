import api from '../api/client';

export interface Exercise {
    id: string;
    name: string;
    description?: string;
    muscle_group?: string; // grupo_muscular in JSON
    type?: string; // tipo in JSON
    image_url?: string;
    video_url?: string;
}

export const getExercises = async (): Promise<Exercise[]> => {
    const response = await api.get<Exercise[]>('/exercises/');
    return response.data;
};
