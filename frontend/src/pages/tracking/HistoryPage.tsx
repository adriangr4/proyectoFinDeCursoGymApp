
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getScheduledWorkouts } from '../../services/tracking';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Filter, Flame, Timer, TrendingUp } from 'lucide-react';

export function HistoryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            getScheduledWorkouts(user.id)
                .then(data => {
                    // Filter only completed workouts
                    const completed = data.filter((w: any) => w.status === 'completed');
                    // Sort by date desc
                    completed.sort((a: any, b: any) => new Date(b.completed_at || b.scheduled_date).getTime() - new Date(a.completed_at || a.scheduled_date).getTime());
                    setWorkouts(completed);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user?.id]);

    // Group workouts by Month/Year or just simple list for now as "Calendar" might be complex to implemented fully in one go.
    // User asked "choose by days", so maybe a list with clear date headers or a calendar view.
    // Let's do a fast list first.

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
                <button onClick={() => navigate('/profile')} className="p-2 hover:bg-muted rounded-full">
                    <ChevronLeft className="size-6" />
                </button>
                <h1 className="text-xl font-bold flex-1">Historial</h1>
                <button className="p-2 hover:bg-muted rounded-full">
                    <Filter className="size-5" />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Stats Summary Card ?? */}
                <div className="bg-card border border-border p-4 rounded-xl flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Total Workouts</p>
                        <p className="text-2xl font-black">{workouts.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Total Tiempo</p>
                        <p className="text-2xl font-black">
                            {Math.floor(workouts.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) / 60 / 60)}h
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">Cargando...</div>
                ) : workouts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No has completado ningún entrenamiento aún.</p>
                        <Link to="/" className="text-primary font-bold hover:underline mt-2 inline-block">Ir a Inicio</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workouts.map((workout) => {
                            const date = new Date(workout.completed_at || workout.scheduled_date);
                            return (
                                <Link to={`/history/${workout.id}`} key={workout.id} className="block group">
                                    <div className="bg-card border border-border rounded-xl p-4 transition-all group-hover:border-primary group-active:scale-[0.99]">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 text-primary p-3 rounded-lg font-bold text-center min-w-[50px]">
                                                    <span className="text-xs uppercase block">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                                                    <span className="text-xl leading-none">{date.getDate()}</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{workout.routine?.name || 'Entrenamiento'}</h3>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {date.toLocaleDateString('es-ES', { weekday: 'long' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5 bg-background/50 p-2 rounded-lg">
                                                <Timer className="size-3.5" />
                                                <span>{Math.floor(workout.duration_seconds / 60)}m</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-background/50 p-2 rounded-lg">
                                                <Flame className="size-3.5" />
                                                <span>{workout.calories_burned}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-background/50 p-2 rounded-lg">
                                                <TrendingUp className="size-3.5" />
                                                <span>{workout.logs?.length || 0} Sets</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
