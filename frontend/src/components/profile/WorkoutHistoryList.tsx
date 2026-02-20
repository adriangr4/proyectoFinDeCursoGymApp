import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Flame, ChevronDown, ChevronUp, Trophy, Dumbbell } from 'lucide-react';
import { useState } from 'react';

interface WorkoutHistoryListProps {
    workouts: any[]; // ScheduledWorkout[]
    routines: Record<string, any>; // id -> Routine
    exercises: Record<string, any>; // id -> Exercise
}

export function WorkoutHistoryList({ workouts, routines, exercises }: WorkoutHistoryListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0min';
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min`;
    };

    if (workouts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <Trophy className="size-12 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-1">Sin historial aún</p>
                <p className="text-sm">Completa tu primer entrenamiento para verlo aquí.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {workouts.map((workout) => {
                const routine = routines[workout.routine_id];
                const isExpanded = expandedId === workout.id;

                return (
                    <motion.div
                        key={workout.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        layout
                        className="bg-card border border-border rounded-2xl overflow-hidden"
                    >
                        <div
                            onClick={() => toggleExpand(workout.id)}
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col gap-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Dumbbell className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">
                                            {routine?.name || 'Entrenamiento Personalizado'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <Calendar className="size-3" />
                                            <span>{formatDate(workout.scheduled_date || workout.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-1 rounded-full text-muted-foreground">
                                    {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="size-4 text-blue-500" />
                                    <span className="font-medium">{formatDuration(workout.duration_seconds)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Flame className="size-4 text-orange-500" />
                                    <span className="font-medium">{Math.round(workout.calories_burned || 0)} Kcal</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Trophy className="size-4 text-yellow-500" />
                                    <span className="font-medium">{workout.rating || '-'} / 5</span>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-border bg-muted/20"
                                >
                                    <div className="p-4 space-y-4">
                                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Resumen de Ejercicios</h4>

                                        {workout.logs && workout.logs.length > 0 ? (
                                            // Group logs by exercise? Typically logs are flat list of sets.
                                            // We need to group them by exercise_id to show Exercise -> Sets
                                            Object.entries(
                                                workout.logs.reduce((acc: any, log: any) => {
                                                    const exId = log.exercise_id;
                                                    if (!acc[exId]) acc[exId] = [];
                                                    acc[exId].push(log);
                                                    return acc;
                                                }, {})
                                            ).map(([exId, logs]: [string, any]) => {
                                                const exercise = exercises[exId];
                                                return (
                                                    <div key={exId} className="bg-background border border-border rounded-xl p-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                                                                <img
                                                                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=100"
                                                                    className="w-full h-full object-cover rounded-lg opacity-50"
                                                                    alt=""
                                                                />
                                                            </div>
                                                            <span className="font-bold text-sm">{exercise?.name || 'Ejercicio desconocido'}</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground text-center">
                                                            <div className="font-bold">Serie</div>
                                                            <div className="font-bold">Kg</div>
                                                            <div className="font-bold">Reps</div>
                                                            <div></div>
                                                        </div>
                                                        <div className="space-y-1 mt-1">
                                                            {logs.map((log: any, i: number) => (
                                                                <div key={i} className="grid grid-cols-4 gap-2 text-xs text-center py-1 border-b border-border/50 last:border-0">
                                                                    <div className="font-mono text-muted-foreground">{log.set_number || i + 1}</div>
                                                                    <div className="font-bold text-foreground">{log.weight_kg}</div>
                                                                    <div className="font-bold text-foreground">{log.reps}</div>
                                                                    {log.notes && <div className="text-[10px] truncate text-left pl-2">{log.notes}</div>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No hay detalles de ejercicios registrados.</p>
                                        )}

                                        {workout.notes && (
                                            <div className="mt-4 pt-2 border-t border-border/50">
                                                <p className="text-xs text-muted-foreground italic">"{workout.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}
