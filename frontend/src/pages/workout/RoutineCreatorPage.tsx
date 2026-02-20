import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Calendar, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseSelector } from '../../components/workout/ExerciseSelector';
import { createRoutine, type Routine, type DailyRoutine, type RoutineExercise } from '../../services/routines';
import type { Exercise } from '../../services/exercises';

export function RoutineCreatorPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [activeDay, setActiveDay] = useState('Monday');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const days = [
        { id: 'Monday', label: 'Lunes', short: 'L' },
        { id: 'Tuesday', label: 'Martes', short: 'M' },
        { id: 'Wednesday', label: 'Miércoles', short: 'X' },
        { id: 'Thursday', label: 'Jueves', short: 'J' },
        { id: 'Friday', label: 'Viernes', short: 'V' },
        { id: 'Saturday', label: 'Sábado', short: 'S' },
        { id: 'Sunday', label: 'Domingo', short: 'D' },
    ];

    // Initialize schedule with empty arrays for each day
    const [weeklyPlan, setWeeklyPlan] = useState<DailyRoutine[]>(
        days.map(d => ({ day: d.id, exercises: [] }))
    );

    const currentDayExercises = weeklyPlan.find(d => d.day === activeDay)?.exercises || [];

    const handleAddExercise = (exercise: Exercise) => {
        const newExercise: RoutineExercise = {
            exercise_id: exercise.id,
            name: exercise.name,
            series: 3, // Default
            reps: '10-12' // Default
        };

        setWeeklyPlan(prev => prev.map(day => {
            if (day.day === activeDay) {
                return { ...day, exercises: [...day.exercises, newExercise] };
            }
            return day;
        }));
    };

    const updateExercise = (index: number, field: keyof RoutineExercise, value: any) => {
        setWeeklyPlan(prev => prev.map(day => {
            if (day.day === activeDay) {
                const newExercises = [...day.exercises];
                newExercises[index] = { ...newExercises[index], [field]: value };
                return { ...day, exercises: newExercises };
            }
            return day;
        }));
    };

    const removeExercise = (index: number) => {
        setWeeklyPlan(prev => prev.map(day => {
            if (day.day === activeDay) {
                return { ...day, exercises: day.exercises.filter((_, i) => i !== index) };
            }
            return day;
        }));
    };

    const handleSave = async () => {
        if (!name.trim()) return alert("Por favor, ponle un nombre a la rutina.");

        // Check if there's at least one exercise
        const hasExercises = weeklyPlan.some(d => d.exercises.length > 0);
        if (!hasExercises) return alert("Añade al menos un ejercicio a la rutina.");

        setIsSaving(true);
        try {
            const routineData: Routine = {
                name,
                weekly_plan: weeklyPlan,
                is_public: false
            };
            await createRoutine(routineData);
            navigate('/library'); // Redirect to library list
        } catch (error) {
            console.error("Error saving routine", error);
            alert("Error al guardar la rutina");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-white pb-20">
            <ExerciseSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleAddExercise}
            />

            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 p-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="size-6" />
                    </button>
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Nombre de la Rutina..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-transparent text-xl font-black placeholder:text-muted-foreground/50 border-none outline-none"
                        />
                    </div>
                    {/* Desktop Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="size-4" />
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </header>

            <main className="p-4 max-w-3xl mx-auto space-y-6">

                {/* Day Selector */}
                <div className="flex justify-between bg-card/50 p-1.5 rounded-2xl backdrop-blur-sm border border-border/50 overflow-x-auto">
                    {days.map(day => (
                        <button
                            key={day.id}
                            onClick={() => setActiveDay(day.id)}
                            className={`flex-1 min-w-[40px] h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 relative ${activeDay === day.id
                                ? 'text-white shadow-lg bg-primary'
                                : 'text-muted-foreground hover:bg-white/5'
                                }`}
                        >
                            {day.short}
                            {activeDay === day.id && (
                                <motion.div
                                    layoutId="activeDay"
                                    className="absolute inset-0 bg-primary rounded-xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Day Header & Add Button */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="size-6 text-primary" />
                        {days.find(d => d.id === activeDay)?.label}
                    </h2>
                    <button
                        onClick={() => setIsSelectorOpen(true)}
                        className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        <Plus className="size-4" />
                        Añadir Ejercicio
                    </button>
                </div>

                {/* Exercises List */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {currentDayExercises.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted rounded-3xl text-center"
                            >
                                <div className="p-4 bg-muted/30 rounded-full mb-4">
                                    <Dumbbell className="size-8 text-muted-foreground" />
                                </div>
                                <p className="text-lg font-medium text-foreground">Día de descanso</p>
                                <p className="text-sm text-muted-foreground mb-6">No hay ejercicios programados</p>
                                <button
                                    onClick={() => setIsSelectorOpen(true)}
                                    className="px-6 py-3 bg-card border border-border rounded-xl font-bold hover:border-primary transition-colors text-sm"
                                >
                                    Buscar Ejercicios
                                </button>
                            </motion.div>
                        ) : (
                            currentDayExercises.map((exercise, index) => (
                                <motion.div
                                    key={`${activeDay}-${index}-${exercise.exercise_id}`}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-card border border-border rounded-2xl p-4 shadow-xs group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-muted rounded-lg flex items-center justify-center font-bold text-muted-foreground">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight">{exercise.name}</h3>
                                                <p className="text-xs text-muted-foreground">Configura las series</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeExercise(index)}
                                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="size-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Series</label>
                                            <div className="flex items-center bg-background rounded-xl border border-input h-12 px-1">
                                                <button
                                                    onClick={() => updateExercise(index, 'series', Math.max(1, exercise.series - 1))}
                                                    className="size-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={exercise.series}
                                                    onChange={(e) => updateExercise(index, 'series', parseInt(e.target.value) || 0)}
                                                    className="flex-1 bg-transparent text-center font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    onClick={() => updateExercise(index, 'series', exercise.series + 1)}
                                                    className="size-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Reps</label>
                                            <div className="flex items-center bg-background rounded-xl border border-input h-12 px-3">
                                                <input
                                                    type="text"
                                                    value={exercise.reps}
                                                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                                    className="w-full bg-transparent text-center font-black outline-none placeholder:text-muted-foreground/30"
                                                    placeholder="10-12"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent md:hidden">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(19,91,236,0.5)] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    <Save className="size-5" />
                    {isSaving ? 'Guardando...' : 'Guardar Rutina'}
                </button>
            </div>
        </div>
    );
}
