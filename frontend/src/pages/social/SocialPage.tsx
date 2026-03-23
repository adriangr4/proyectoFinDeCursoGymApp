import { useState, useEffect, useRef } from 'react';
import { Heart, Star, Bookmark, ChefHat, Dumbbell, MessageCircle, X, Send, Plus, Loader2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getSocialFeed, toggleLike, ratePost, importContent,
    getComments, addComment, shareToCommunity,
    deletePost, deleteComment,
    type Post, type Comment
} from '../../services/social';
import api from '../../api/client';
import { getRoutines, clearRoutineCache } from '../../services/routines';
import { getDiets } from '../../services/diet';
import { cn } from '../../lib/utils';

// ── Comment Drawer ─────────────────────────────────────────────────────────
function CommentDrawer({ post, onClose }: { post: Post; onClose: () => void }) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getComments(post.id).then(c => {
            setComments(c);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [post.id]);

    const handleSend = async () => {
        if (!text.trim() || !user) return;
        setSending(true);
        try {
            const newComment = await addComment(post.id, text.trim());
            setComments(prev => [...prev, newComment]);
            setText('');
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (e) {
            console.error('Failed to add comment', e);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar este comentario?")) return;
        try {
            await deleteComment(post.id, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (e) {
            console.error('Failed to delete comment', e);
            alert("Error al eliminar el comentario.");
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-t-3xl border-t border-x border-border flex flex-col max-h-[80dvh] animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h3 className="font-bold text-lg">Comentarios</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {loading && <p className="text-center text-muted-foreground text-sm py-8">Cargando...</p>}
                    {!loading && comments.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">
                            Sé el primero en comentar 💬
                        </p>
                    )}
                    {comments.map(c => (
                        <div key={c.id} className="flex items-start gap-3">
                            <div
                                className="size-8 rounded-full bg-muted bg-cover bg-center shrink-0"
                                style={{ backgroundImage: `url("${c.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author_name}`}")` }}
                            />
                            <div className="flex-1 flex flex-col items-start min-w-0">
                                <div className="bg-muted/40 rounded-2xl rounded-tl-none px-3 py-2 w-full">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-xs font-bold text-primary truncate">{c.author_name}</p>
                                        {user && (c.author_id === user.id || post.creator_id === user.id || user.is_admin) && (
                                            <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 ml-2">
                                                <X className="size-3" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground break-words">{c.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-border flex items-center gap-3 shrink-0">
                    <div
                        className="size-8 rounded-full bg-muted bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url("${user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}")` }}
                    />
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Escribe un comentario..."
                        className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!text.trim() || sending}
                        className="p-2 bg-primary rounded-full text-white disabled:opacity-40 transition-opacity"
                    >
                        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Rating Modal ────────────────────────────────────────────────────────────
type RatingModalState = {
    isOpen: boolean;
    postId: string | null;
    contentType: 'routine' | 'diet' | null;
    contentId: string | null;
    /** If set, auto-import after rating succeeds */
    importAfterRating: boolean;
};

// ── Share Selector Modal ──────────────────────────────────────────────────────
function ShareSelectorModal({ type, onClose, onShared }: { type: 'routine' | 'diet', onClose: () => void, onShared: () => void }) {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharingId, setSharingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                if (type === 'routine') {
                    const routines = await getRoutines();
                    setItems(routines);
                } else {
                    const diets = await getDiets();
                    setItems(diets);
                }
            } catch (e) {
                console.error('Failed to load items to share', e);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [type]);

    const handleShare = async (item: any) => {
        if (!user) return;
        setSharingId(item.id);
        try {
            await shareToCommunity({
                content_type: type,
                content_id: item.id,
                content_name: type === 'routine' ? item.name : item.name || 'Mi Dieta',
                creator_id: user.id,
                creator_name: user.username,
                creator_avatar: user.profilePicture
            });
            alert('¡Compartido con éxito en la comunidad!');
            onShared();
            onClose();
        } catch (e: any) {
            alert(e?.response?.data?.detail || 'Error al compartir o ya estaba compartido.');
        } finally {
            setSharingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-t-3xl border-t border-x border-border flex flex-col max-h-[80dvh] animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <h3 className="font-bold text-lg">Compartir {type === 'routine' ? 'Rutina' : 'Dieta'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="size-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                    {loading && <p className="text-center text-muted-foreground py-8">Cargando tu biblioteca...</p>}
                    {!loading && items.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No tienes {type === 'routine' ? 'rutinas' : 'dietas'} guardadas.</p>
                    )}
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/20">
                            <div>
                                <p className="font-bold">{type === 'routine' ? item.name : item.name || 'Plan de Dieta'}</p>
                            </div>
                            <button
                                onClick={() => handleShare(item)}
                                disabled={sharingId === item.id}
                                className="flex items-center gap-2 bg-primary px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                            >
                                {sharingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                Compartir
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Content Preview Modal ───────────────────────────────────────────────────
function ContentPreviewModal({ post, onClose, onImport, importing }: {
    post: Post;
    onClose: () => void;
    onImport: () => void;
    importing: boolean;
}) {
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/social/preview/${post.content_type}/${post.content_id}`)
            .then(r => setPreview(r.data))
            .catch(() => setPreview(null))
            .finally(() => setLoading(false));
    }, [post.content_id, post.content_type]);

    // Group exercises by day_of_week
    const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const byDay: Record<number, any[]> = {};
    if (preview?.exercises) {
        for (const ex of preview.exercises) {
            const d = ex.day_of_week ?? 1;
            (byDay[d] = byDay[d] || []).push(ex);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-t-3xl border-t border-x border-border flex flex-col max-h-[85dvh] animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        {post.content_type === 'routine' ? <Dumbbell className="size-5 text-primary"/> : <ChefHat className="size-5 text-green-400"/>}
                        <h3 className="font-bold text-lg truncate">{post.content_name}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {loading && <p className="text-center text-muted-foreground py-8">Cargando contenido...</p>}
                    {!loading && !preview && <p className="text-center text-muted-foreground py-8">No se pudo cargar el contenido.</p>}

                    {!loading && preview && post.content_type === 'routine' && (
                        Object.keys(byDay).length === 0
                            ? <p className="text-center text-muted-foreground py-4">Esta rutina no tiene ejercicios registrados aún.</p>
                            : Object.entries(byDay)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([day, exs]) => (
                                    <div key={day}>
                                        <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">{dayNames[Number(day)]}</p>
                                        <div className="space-y-2">
                                            {exs.map((ex: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                                                    <Dumbbell className="size-4 text-muted-foreground shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate">{ex.exercise?.name || 'Ejercicio'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {ex.target_sets} series · {ex.reps_display || ex.target_reps_min}{ex.target_reps_max ? `-${ex.target_reps_max}` : ''} reps
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                    )}

                    {!loading && preview && post.content_type === 'diet' && (
                        <div className="space-y-2">
                            {preview.description && <p className="text-sm text-muted-foreground">{preview.description}</p>}
                            <p className="text-sm text-muted-foreground italic">Plan de dieta disponible para importar.</p>
                        </div>
                    )}
                </div>

                {/* Footer - Import button */}
                <div className="px-5 py-4 border-t border-border shrink-0">
                    <button
                        onClick={onImport}
                        disabled={importing}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-2xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {importing ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
                        {importing ? 'Importando...' : 'Importar a mi biblioteca'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main SocialPage ────────────────────────────────────────────────────────
export function SocialPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'global' | 'friends'>('global');
    const [fabOpen, setFabOpen] = useState(false);

    const [ratingModal, setRatingModal] = useState<RatingModalState>({
        isOpen: false, postId: null, contentType: null, contentId: null, importAfterRating: false
    });
    const [hoverScore, setHoverScore] = useState(0);

    const [commentDrawer, setCommentDrawer] = useState<Post | null>(null);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [shareSelector, setShareSelector] = useState<'routine' | 'diet' | null>(null);
    const [previewPost, setPreviewPost] = useState<Post | null>(null);

    const fetchFeed = async (filter: 'global' | 'friends' = activeFilter) => {
        setLoading(true);
        try {
            const feed = await getSocialFeed(filter);
            setPosts(feed);
        } catch (e) {
            console.error('Failed to load feed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFeed('global'); }, []);

    // ── Like ──────────────────────────────────────────────────────────────
    const handleLike = async (postId: string) => {
        if (!user) return;
        setPosts(current => current.map(p => {
            if (p.id !== postId) return p;
            const hasLiked = p.likes.includes(user.id);
            return { ...p, likes: hasLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id] };
        }));
        try {
            await toggleLike(postId);
        } catch {
            fetchFeed();
        }
    };

    // ── Delete Post ────────────────────────────────────────────────────────
    const handleDeletePost = async (postId: string) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta publicación permanentemente?")) return;
        try {
            await deletePost(postId);
            setPosts(current => current.filter(p => p.id !== postId));
        } catch (e) {
            console.error("Failed to delete post", e);
            alert("Error al eliminar la publicación.");
        }
    };

    // ── Import (rating gate) ─────────────────────────────────────────────
    const handleImport = async (post: Post) => {
        setImportingId(post.id);
        try {
            await importContent(post.id, post.content_type, post.content_id);
            // Invalidate cache so next visit shows the new imported content
            clearRoutineCache();
            alert('¡Importado con éxito a tu biblioteca! Ya puedes verla en tus rutinas 🎉');
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            if (detail === 'rating_required') {
                setRatingModal({
                    isOpen: true,
                    postId: post.id,
                    contentType: post.content_type,
                    contentId: post.content_id,
                    importAfterRating: true,
                });
            } else {
                const msg = e?.response?.data?.detail || 'Error al importar el contenido';
                alert(`Error al importar: ${msg}`);
            }
        } finally {
            setImportingId(null);
        }
    };


    // ── Rating ────────────────────────────────────────────────────────────
    const submitRating = async (score: number) => {
        const { postId, contentType, contentId, importAfterRating } = ratingModal;
        if (!postId || !contentType || !contentId) return;

        setRatingModal({ isOpen: false, postId: null, contentType: null, contentId: null, importAfterRating: false });
        setHoverScore(0);

        try {
            const res = await ratePost(postId, score, contentType, contentId);
            setPosts(current => current.map(p =>
                p.id === postId ? { ...p, rating_sum: res.rating_sum, rating_count: res.rating_count } : p
            ));

            // Auto-import after successful rating
            if (importAfterRating) {
                try {
                    await importContent(postId, contentType, contentId);
                    alert('¡Valorado e importado con éxito a tu biblioteca!');
                } catch {
                    alert('Valoración guardada. Pulsa "Importar" de nuevo para añadir a tu biblioteca.');
                }
            } else {
                alert('¡Valorado correctamente!');
            }
        } catch (e: any) {
            const detail = e?.response?.data?.detail;
            if (detail === 'already_rated') {
                alert('Ya has valorado este contenido anteriormente.');
                setRatingModal({ isOpen: false, postId: null, contentType: null, contentId: null, importAfterRating: false });
                // Still try to import if that was the intent
                if (importAfterRating && contentType && contentId) {
                    try {
                        await importContent(postId, contentType, contentId);
                        alert('¡Importado con éxito a tu biblioteca!');
                    } catch { /* ignore */ }
                }
            } else {
                alert('Error al enviar la valoración');
            }
        }
    };

    return (
        <div className="w-full bg-background overflow-x-hidden">

            {/* ── Sticky Header ── */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border transition-colors duration-300">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <h2 className="text-foreground text-2xl font-bold tracking-tight">Comunidad</h2>
                    <button className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 px-4 pb-4 overflow-x-auto no-scrollbar pt-2">
                    {([
                        { id: 'global', label: 'Global' },
                        { id: 'friends', label: 'Amigos' },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveFilter(tab.id); fetchFeed(tab.id); }}
                            className={cn(
                                'flex h-9 shrink-0 items-center justify-center rounded-full pl-5 pr-5 transition-all active:scale-95 text-sm font-semibold',
                                activeFilter === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* ── Feed ── */}
            <main className="w-full max-w-lg mx-auto flex flex-col gap-1 pb-28">
                {loading && <div className="p-10 text-center text-muted-foreground">Cargando publicaciones...</div>}
                {!loading && posts.length === 0 && (
                    <div className="p-10 text-center text-muted-foreground">
                        No hay publicaciones recientes.<br />¡Comparte tu primera rutina!
                    </div>
                )}

                {posts.map(post => {
                    const hasLiked = user ? post.likes.includes(user.id) : false;
                    const avgRating = post.rating_count > 0 ? (post.rating_sum / post.rating_count).toFixed(1) : '0.0';
                    const fallbackImage = post.content_type === 'routine'
                        ? 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop'
                        : 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop';

                    return (
                        <article key={post.id} className="flex flex-col bg-transparent border-b border-border pb-5 pt-2">

                            {/* Post Header */}
                            <div className="flex items-center gap-3 px-4 py-3 justify-between">
                                <button
                                    className="flex items-center gap-3 min-w-0"
                                    onClick={() => navigate(`/community/user/${post.creator_id}`)}
                                >
                                    <div
                                        className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 ring-2 ring-offset-2 ring-primary ring-offset-background shrink-0"
                                        style={{ backgroundImage: `url("${post.creator_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.creator_name}`}")` }}
                                    />
                                    <div className="flex flex-col justify-center min-w-0">
                                        <p className="text-foreground text-sm font-bold leading-tight truncate">{post.creator_name}</p>
                                        <p className="text-muted-foreground text-xs font-normal leading-normal">
                                            {post.content_type === 'routine' ? 'Compartió una rutina' : 'Compartió una dieta'}
                                        </p>
                                    </div>
                                </button>
                                {user && (post.creator_id === user.id || user.is_admin) && (
                                    <button onClick={() => handleDeletePost(post.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                        <X className="size-5" />
                                    </button>
                                )}
                            </div>

                            {/* Content Image — click to preview */}
                            <div
                                className="w-full aspect-4/5 bg-muted relative overflow-hidden group cursor-pointer"
                                onClick={() => setPreviewPost(post)}
                            >
                                <div
                                    className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                                    style={{ backgroundImage: `url("${post.content_image || fallbackImage}")` }}
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        {post.content_type === 'routine'
                                            ? <Dumbbell className="text-primary size-5" />
                                            : <ChefHat className="text-primary size-5" />
                                        }
                                        <h3 className="text-2xl font-bold text-white truncate">{post.content_name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-amber-400 font-bold text-sm">
                                            <Star className="size-4 fill-amber-400" />
                                            {avgRating} ({post.rating_count})
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interaction Bar */}
                            <div className="flex items-center justify-between px-4 pt-3 pb-1">
                                <div className="flex items-center gap-5">
                                    {/* Like */}
                                    <button onClick={() => handleLike(post.id)} className="group flex items-center gap-1.5 transition-colors">
                                        <Heart className={cn('size-7 transition-all group-active:scale-90', hasLiked ? 'fill-red-500 text-red-500' : 'text-foreground hover:text-red-400')} />
                                        <span className="text-sm font-bold text-foreground">{post.likes.length}</span>
                                    </button>
                                    {/* Comment */}
                                    <button onClick={() => setCommentDrawer(post)} className="group flex items-center gap-1.5 text-foreground hover:text-primary transition-colors">
                                        <MessageCircle className="size-7 group-active:scale-90 transition-transform" />
                                        <span className="text-sm font-bold">{post.comment_count}</span>
                                    </button>
                                    {/* Star rating */}
                                    <button
                                        onClick={() => setRatingModal({ isOpen: true, postId: post.id, contentType: post.content_type, contentId: post.content_id, importAfterRating: false })}
                                        className="group flex items-center justify-center text-foreground hover:text-amber-400 transition-colors"
                                    >
                                        <Star className="size-7 group-active:scale-90 transition-transform" />
                                    </button>
                                </div>
                                {/* Import button → opens preview instead of importing blindly */}
                                <button
                                    onClick={() => setPreviewPost(post)}
                                    disabled={importingId === post.id}
                                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors bg-muted px-4 py-2 rounded-full font-bold text-sm active:scale-95 disabled:opacity-50"
                                >
                                    {importingId === post.id
                                        ? <Loader2 className="size-4 animate-spin" />
                                        : <Eye className="size-4" />
                                    }
                                    Ver e Importar
                                </button>
                            </div>

                            {/* Inline comment input */}
                            <div className="flex items-center gap-2 px-4 mt-2">
                                <div
                                    className="size-6 rounded-full bg-muted bg-cover bg-center shrink-0"
                                    style={{ backgroundImage: `url("${user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}")` }}
                                />
                                <button
                                    onClick={() => setCommentDrawer(post)}
                                    className="flex-1 text-left text-sm text-muted-foreground bg-muted/40 rounded-full px-4 py-1.5 hover:bg-muted transition-colors"
                                >
                                    Añade un comentario...
                                </button>
                            </div>
                        </article>
                    );
                })}
            </main>

            {/* ── Floating Action Button ── */}
            <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-3">
                {fabOpen && (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
                        {/* Option 1: Create or Share Routine */}
                        <div className="flex flex-col items-end gap-2 bg-card p-3 rounded-2xl border border-border shadow-2xl">
                            <span className="text-sm font-bold text-muted-foreground px-2">Rutinas</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShareSelector('routine'); setFabOpen(false); }}
                                    className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground border border-border text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    Compartir existente
                                </button>
                                <button
                                    onClick={() => navigate('/workout/create')}
                                    className="flex items-center justify-center gap-2 bg-primary text-white border border-primary text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Plus className="size-4" /> Nueva
                                </button>
                            </div>
                        </div>

                        {/* Option 2: Create or Share Diet */}
                        <div className="flex flex-col items-end gap-2 bg-card p-3 rounded-2xl border border-border shadow-2xl">
                            <span className="text-sm font-bold text-muted-foreground px-2">Dietas</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setShareSelector('diet'); setFabOpen(false); }}
                                    className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground border border-border text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    Compartir existente
                                </button>
                                <button
                                    onClick={() => navigate('/diet/create')}
                                    className="flex items-center justify-center gap-2 bg-green-500 text-white border border-green-500 text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Plus className="size-4" /> Nueva
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setFabOpen(!fabOpen)}
                    className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-primary/40 transition-all active:scale-95 duration-300",
                        fabOpen ? 'bg-muted-foreground rotate-45' : 'bg-primary hover:bg-primary/90'
                    )}
                >
                    <Plus className="size-7" />
                </button>
            </div>

            {/* ── Rating Modal ── */}
            {ratingModal.isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border">
                        <h3 className="text-xl font-bold mb-2 text-center">Valorar contenido</h3>
                        <p className="text-muted-foreground mb-6 text-center text-sm">
                            {ratingModal.importAfterRating
                                ? 'Debes valorar este contenido antes de poder importarlo.'
                                : 'Selecciona una puntuación y ayuda a la comunidad.'
                            }
                        </p>

                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverScore(star)}
                                    onMouseLeave={() => setHoverScore(0)}
                                    onClick={() => submitRating(star)}
                                    className="p-2 transition-transform hover:scale-110 active:scale-90"
                                >
                                    <Star className={cn('size-10 transition-colors', star <= hoverScore ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => { setRatingModal({ isOpen: false, postId: null, contentType: null, contentId: null, importAfterRating: false }); setHoverScore(0); }}
                                className="px-6 py-2 rounded-full font-bold hover:bg-muted transition-colors text-muted-foreground"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Share Selector Drawer ── */}
            {shareSelector && (
                <ShareSelectorModal
                    type={shareSelector}
                    onClose={() => setShareSelector(null)}
                    onShared={() => fetchFeed(activeFilter)}
                />
            )}

            {/* ── Comment Drawer ── */}
            {commentDrawer && (
                <CommentDrawer post={commentDrawer} onClose={() => setCommentDrawer(null)} />
            )}

            {/* ── Content Preview Modal ── */}
            {previewPost && (
                <ContentPreviewModal
                    post={previewPost}
                    onClose={() => setPreviewPost(null)}
                    importing={importingId === previewPost.id}
                    onImport={() => {
                        const p = previewPost;
                        setPreviewPost(null);
                        handleImport(p);
                    }}
                />
            )}
        </div>
    );
}
