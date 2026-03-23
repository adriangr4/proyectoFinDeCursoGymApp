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
    comment_count: number;
    created_at: string;
}

export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    author_name: string;
    author_avatar?: string;
    text: string;
    created_at: string;
}

export interface PublicUserProfile {
    id: string;
    username: string;
    profile_picture?: string;
    followers_count: number;
    following_count: number;
    routine_avg_rating: number;
    diet_avg_rating: number;
    is_following: boolean;
}

// ─── Feed ───────────────────────────────
export const getSocialFeed = async (filter: string = 'global'): Promise<Post[]> => {
    const res = await api.get(`/social/feed?filter=${filter}`);
    return res.data;
};

// ─── Share ──────────────────────────────
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

// ─── Likes ──────────────────────────────
export const toggleLike = async (postId: string): Promise<{ success: boolean; likes: string[] }> => {
    const res = await api.post(`/social/posts/${postId}/like`);
    return res.data;
};

// ─── Ratings ────────────────────────────
export const ratePost = async (
    postId: string,
    score: number,
    contentType: 'routine' | 'diet',
    contentId: string
): Promise<{ success: boolean; rating_sum: number; rating_count: number }> => {
    const res = await api.post(`/social/posts/${postId}/rate`, {
        content_type: contentType,
        content_id: contentId,
        score,
    });
    return res.data;
};

// ─── Import (rating-gated) ──────────────
export const importContent = async (
    postId: string,
    contentType: 'routine' | 'diet',
    contentId: string
): Promise<{ success: boolean; new_id: string; type: string }> => {
    const res = await api.post(
        `/social/import?post_id=${postId}&content_type=${contentType}&content_id=${contentId}`
    );
    return res.data;
};

// ─── Comments ───────────────────────────
export const getComments = async (postId: string): Promise<Comment[]> => {
    const res = await api.get(`/social/posts/${postId}/comments`);
    return res.data;
};

export const addComment = async (postId: string, text: string): Promise<Comment> => {
    const res = await api.post(`/social/posts/${postId}/comments`, { text });
    return res.data;
};

// ─── Public Profile ─────────────────────
export const getPublicProfile = async (userId: string): Promise<PublicUserProfile> => {
    const res = await api.get(`/social/users/${userId}/public`);
    return res.data;
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
    const res = await api.get(`/social/users/${userId}/posts`);
    return res.data;
};

// ─── Follow ─────────────────────────────
export const followUser = async (userId: string): Promise<{ success: boolean; action: string }> => {
    const res = await api.post(`/social/users/${userId}/follow`);
    return res.data;
};

export const unfollowUser = async (userId: string): Promise<{ success: boolean; action: string }> => {
    const res = await api.delete(`/social/users/${userId}/follow`);
    return res.data;
};

// ─── Moderation ──────────────────────────
export const deletePost = async (postId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/social/posts/${postId}`);
    return res.data;
};

export const deleteComment = async (postId: string, commentId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/social/posts/${postId}/comments/${commentId}`);
    return res.data;
};

