import { useState } from 'react';
import { Share2, X, Dumbbell, ChefHat, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { shareToCommunity } from '../../services/social';

interface ShareModalProps {
    isOpen: boolean;
    contentType: 'routine' | 'diet';
    contentId: string;
    contentName: string;
    onClose: () => void;
}

export function ShareModal({ isOpen, contentType, contentId, contentName, onClose }: ShareModalProps) {
    const { user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleShare = async () => {
        if (!user) return;
        setStatus('loading');
        try {
            await shareToCommunity({
                content_type: contentType,
                content_id: contentId,
                content_name: contentName,
                creator_id: user.id,
                creator_name: user.username ?? 'Usuario',
                creator_avatar: user.profilePicture ?? undefined,
            });
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
            }, 1500);
        } catch (e: any) {
            setStatus('error');
            setErrorMsg(e?.response?.data?.detail ?? 'Error al compartir');
        }
    };

    const Icon = contentType === 'routine' ? Dumbbell : ChefHat;
    const label = contentType === 'routine' ? 'Rutina' : 'Dieta';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border slide-in-from-bottom-4 animate-in duration-300">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Share2 className="size-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Compartir en Comunidad</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content preview */}
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl mb-6 border border-border/50">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Icon className="size-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                        <p className="font-bold text-foreground leading-tight">{contentName}</p>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground text-center mb-6">
                    Tu {label.toLowerCase()} será visible para toda la comunidad. Otros usuarios podrán valorarla e importarla a su biblioteca.
                </p>

                {/* Status messages */}
                {status === 'error' && (
                    <p className="text-sm text-red-500 text-center mb-4 bg-red-500/10 rounded-xl px-3 py-2">{errorMsg}</p>
                )}

                {/* Actions */}
                {status === 'success' ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-green-500 font-bold">
                        <CheckCircle2 className="size-5" />
                        ¡Compartido con éxito!
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-2xl font-bold border border-border hover:bg-muted transition-colors text-muted-foreground"
                            disabled={status === 'loading'}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={status === 'loading'}
                            className="flex-1 py-3 rounded-2xl font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-60"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Share2 className="size-4" />
                            )}
                            {status === 'loading' ? 'Compartiendo...' : 'Compartir'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
