import api from '../api/client';

export interface Post {
    id: string;
    content_type: 'routine' | 'diet';
    content_id: string;
    content_name: string;
    content_image?: string;

    creator_id: string;
    creator_name: string;
    creator_avatar?: string;

    likes: string[]; // User IDs
    rating_sum: number;
    rating_count: number;
    created_at: string;
}

export const getSocialFeed = async (): Promise<Post[]> => {
    const res = await api.get('/social/feed');
    return res.data;
};

export const shareToCommunity = async (payload: {
    content_type: 'routine' | 'diet';
    content_id: string;
    content_name: string;
    content_image?: string;
    creator_id: string;
    creator_name: string;
    creator_avatar?: string;
}): Promise<Post> => {
    const res = await api.post('/social/share', payload);
    return res.data;
};

export const toggleLike = async (postId: string): Promise<{ success: boolean; likes: string[] }> => {
    const res = await api.post(`/social/posts/${postId}/like`);
    return res.data;
};

export const ratePost = async (postId: string, score: number, contentType: 'routine' | 'diet', contentId: string): Promise<{ success: boolean; rating_sum: number; rating_count: number }> => {
    const res = await api.post(`/social/posts/${postId}/rate`, {
        content_type: contentType,
        content_id: contentId,
        score
    });
    return res.data;
};

export const importContent = async (contentType: 'routine' | 'diet', contentId: string): Promise<{ success: boolean; new_id: string; type: string }> => {
    const res = await api.post(`/social/import?content_type=${contentType}&content_id=${contentId}`);
    return res.data;
};
