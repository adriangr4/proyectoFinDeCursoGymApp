
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScheduledWorkouts, getWorkoutById } from '../../services/tracking';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Timer, Flame, Dumbbell, Star, TrendingUp } from 'lucide-react';

export function WorkoutDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id && id) {
            getWorkoutById(id)
                .then(setWorkout)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user?.id, id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    if (!workout) return <div className="min-h-screen flex items-center justify-center">Entrenamiento no encontrado</div>;

    const date = new Date(workout.completed_at || workout.scheduled_date);

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
                    <ChevronLeft className="size-6" />
                </button>
                <h1 className="text-xl font-bold flex-1 text-center pr-10">Detalles</h1>
            </div>

            <div className="p-6">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black mb-2">{workout.routine?.name || 'Rutina Personalizada'}</h2>
                    <p className="text-muted-foreground capitalize">
                        {date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex justify-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`size-4 ${star <= (workout.rating || 0) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-card border border-border p-4 rounded-xl text-center">
                        <Timer className="size-6 text-primary mx-auto mb-2" />
                        <p className="text-xl font-bold">{Math.floor(workout.duration_seconds / 60)}m</p>
                        <p className="text-xs text-muted-foreground">Duración</p>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-xl text-center">
                        <Flame className="size-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{workout.calories_burned}</p>
                        <p className="text-xs text-muted-foreground">Calorías</p>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-xl text-center">
                        <Dumbbell className="size-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{workout.logs?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Sets</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/20">
                        <h3 className="font-bold flex items-center gap-2">
                            <TrendingUp className="size-4" /> Desglose de Ejercicios
                        </h3>
                    </div>

                    <div className="divide-y divide-border">
                        {workout.logs && workout.logs.map((log: any, i: number) => (
                            <div key={i} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">{log.exercise?.name || `Ejercicio ${log.exercise_id}`}</p>
                                    <p className="text-xs text-muted-foreground">Set {log.set_number}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-black">{log.weight_kg}</span>
                                    <span className="text-xs text-muted-foreground font-bold ml-1">KG</span>
                                    <span className="mx-2 text-border font-light">|</span>
                                    <span className="text-lg font-black">{log.reps}</span>
                                    <span className="text-xs text-muted-foreground font-bold ml-1">REPS</span>
                                </div>
                            </div>
                        ))}
                        {(!workout.logs || workout.logs.length === 0) && (
                            <div className="p-8 text-center text-muted-foreground">
                                No hay registros detallados para este entrenamiento.
                            </div>
                        )}
                    </div>
                </div>

                {workout.notes && (
                    <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                        <p className="text-xs font-bold text-yellow-500 uppercase mb-1">Notas</p>
                        <p className="text-sm italic text-yellow-200/80">"{workout.notes}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}
