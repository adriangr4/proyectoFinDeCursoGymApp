import { useState, useEffect } from 'react';
import { Heart, Star, Bookmark, ChefHat, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSocialFeed, toggleLike, ratePost, importContent, type Post } from '../../services/social';
import { cn } from '../../lib/utils';

export function SocialPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [ratingModal, setRatingModal] = useState<{ isOpen: boolean, postId: string | null, contentType: 'routine' | 'diet' | null, contentId: string | null }>({
        isOpen: false, postId: null, contentType: null, contentId: null
    });
    const [hoverScore, setHoverScore] = useState(0);

    const fetchFeed = async () => {
        try {
            const feed = await getSocialFeed();
            setPosts(feed);
        } catch (e) {
            console.error("Failed to load feed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const handleLike = async (postId: string) => {
        if (!user) return;

        // Optimistic UI update
        setPosts(current => current.map(p => {
            if (p.id === postId) {
                const hasLiked = p.likes.includes(user.id);
                return {
                    ...p,
                    likes: hasLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id]
                };
            }
            return p;
        }));

        try {
            await toggleLike(postId);
        } catch (e) {
            console.error("Failed to toggle like", e);
            fetchFeed(); // Revert on failure
        }
    };

    const submitRating = async (score: number) => {
        const { postId, contentType, contentId } = ratingModal;
        if (!postId || !contentType || !contentId) return;

        try {
            const res = await ratePost(postId, score, contentType, contentId);
            setPosts(current => current.map(p => {
                if (p.id === postId) {
                    return { ...p, rating_sum: res.rating_sum, rating_count: res.rating_count };
                }
                return p;
            }));
            setRatingModal({ isOpen: false, postId: null, contentType: null, contentId: null });
        } catch (e) {
            console.error("Failed to submit rating", e);
            alert("Error al enviar la valoración");
        }
    };

    const handleImport = async (contentType: 'routine' | 'diet', contentId: string) => {
        try {
            const res = await importContent(contentType, contentId);
            if (res.success) {
                alert(`¡Importado con éxito a tu biblioteca!`);
            }
        } catch (e: any) {
            console.error("Failed to import", e);
            alert(e.response?.data?.detail || "Error al importar este contenido");
        }
    };

    return (
        <div className="w-full bg-background overflow-x-hidden">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border transition-colors duration-300">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <h2 className="text-foreground text-2xl font-bold tracking-tight">Comunidad</h2>
                    <button className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors text-foreground group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 px-4 pb-4 overflow-x-auto no-scrollbar pt-2">
                    <button onClick={fetchFeed} className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary pl-5 pr-5 shadow-lg shadow-primary/25 transition-transform active:scale-95">
                        <p className="text-white text-sm font-semibold leading-normal">Global</p>
                    </button>
                </div>
            </header>

            {/* Main Feed */}
            <main className="w-full max-w-lg mx-auto flex flex-col gap-1">
                {loading && <div className="p-10 text-center text-muted-foreground">Cargando publicaciones...</div>}
                {!loading && posts.length === 0 && (
                    <div className="p-10 text-center text-muted-foreground">No hay publicaciones recientes. ¡Comparte tu primera rutina!</div>
                )}

                {posts.map(post => {
                    const hasLiked = user ? post.likes.includes(user.id) : false;
                    const avgRating = post.rating_count > 0 ? (post.rating_sum / post.rating_count).toFixed(1) : "0.0";
                    const fallbackImage = post.content_type === 'routine'
                        ? 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop'
                        : 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop';

                    return (
                        <article key={post.id} className="flex flex-col bg-transparent border-b border-border pb-5 pt-2">
                            <div className="flex items-center gap-3 px-4 py-3 justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 ring-2 ring-offset-2 ring-primary ring-offset-background" style={{ backgroundImage: `url("${post.creator_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + post.creator_name}")` }}></div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-foreground text-sm font-bold leading-tight">{post.creator_name}</p>
                                        <p className="text-muted-foreground text-xs font-normal leading-normal">
                                            {post.content_type === 'routine' ? 'Compartió una rutina' : 'Compartió una dieta'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content Display */}
                            <div className="w-full aspect-[4/5] bg-muted relative overflow-hidden group">
                                <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${post.content_image || fallbackImage}")` }}></div>
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        {post.content_type === 'routine' ? <Dumbbell className="text-primary size-5" /> : <ChefHat className="text-primary size-5" />}
                                        <h3 className="text-2xl font-bold text-white">{post.content_name}</h3>
                                    </div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-amber-400 font-bold text-sm">
                                            <Star className="size-4 fill-amber-400" />
                                            {avgRating} ({post.rating_count})
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interaction Bar */}
                            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                                <div className="flex items-center gap-6">
                                    <button onClick={() => handleLike(post.id)} className="group flex items-center justify-center transition-colors">
                                        <Heart className={cn("size-7 transition-all group-active:scale-90", hasLiked ? "fill-red-500 text-red-500" : "text-foreground hover:text-red-500")} />
                                        <span className="ml-2 font-bold text-sm">{post.likes.length}</span>
                                    </button>
                                    <button
                                        onClick={() => setRatingModal({ isOpen: true, postId: post.id, contentType: post.content_type, contentId: post.content_id })}
                                        className="group flex items-center justify-center text-foreground hover:text-amber-400 transition-colors"
                                    >
                                        <Star className="size-7 group-active:scale-90 transition-transform" />
                                    </button>
                                </div>
                                <button onClick={() => handleImport(post.content_type, post.content_id)} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors bg-muted px-4 py-2 rounded-full font-bold text-sm active:scale-95">
                                    <Bookmark className="size-5" />
                                    Importar
                                </button>
                            </div>
                        </article>
                    );
                })}
            </main>

            {ratingModal.isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border">
                        <h3 className="text-xl font-bold mb-2 text-center">Valorar Plan</h3>
                        <p className="text-muted-foreground mb-6 text-center text-sm">Selecciona una puntuación para este plan y ayuda a la comunidad.</p>

                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverScore(star)}
                                    onMouseLeave={() => setHoverScore(0)}
                                    onClick={() => submitRating(star)}
                                    className="p-2 transition-transform hover:scale-110 active:scale-90"
                                >
                                    <Star className={cn("size-10 transition-colors", star <= hoverScore ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setRatingModal({ isOpen: false, postId: null, contentType: null, contentId: null })}
                                className="px-6 py-2 rounded-full font-bold hover:bg-muted transition-colors text-muted-foreground"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
