import { useState, useEffect } from 'react';
import { Search, X, Dumbbell } from 'lucide-react';
import { getExercises, type Exercise } from '../../services/exercises';
import { useDebounce } from '../../hooks/useDebounce';

interface ExerciseSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (exercise: Exercise) => void;
}

export function ExerciseSelector({ isOpen, onClose, onSelect }: ExerciseSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && exercises.length === 0) {
            setIsLoading(true);
            getExercises()
                .then(data => {
                    setExercises(data);
                    setFilteredExercises(data);
                })
                .catch(err => console.error("Error loading exercises", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    useEffect(() => {
        let result = exercises;

        if (debouncedSearch) {
            result = result.filter(ex =>
                ex.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                ex.muscle_group?.toLowerCase().includes(debouncedSearch.toLowerCase())
            );
        }

        if (selectedMuscle) {
            result = result.filter(ex => ex.muscle_group === selectedMuscle);
        }

        setFilteredExercises(result);
    }, [debouncedSearch, selectedMuscle, exercises]);

    if (!isOpen) return null;

    const muscleGroups = Array.from(new Set(exercises.map(e => e.muscle_group).filter(Boolean))) as string[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-lg h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-card z-10">
                    <div>
                        <h3 className="font-bold text-lg">Seleccionar Ejercicio</h3>
                        <p className="text-xs text-muted-foreground">Busca y añade a tu rutina</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="p-4 space-y-3 bg-muted/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button
                            onClick={() => setSelectedMuscle(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${!selectedMuscle ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}
                        >
                            Todos
                        </button>
                        {muscleGroups.map(muscle => (
                            <button
                                key={muscle}
                                onClick={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${muscle === selectedMuscle ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'}`}
                            >
                                {muscle}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <p className="text-xs">Cargando ejercicios...</p>
                        </div>
                    ) : filteredExercises.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                            <Dumbbell className="size-12 text-muted-foreground/20 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No se encontraron ejercicios</p>
                            <p className="text-xs text-muted-foreground/50">Intenta con otro término de búsqueda</p>
                        </div>
                    ) : (
                        filteredExercises.map(exercise => (
                            <button
                                key={exercise.id}
                                onClick={() => { onSelect(exercise); onClose(); }}
                                className="w-full text-left p-3 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border transition-all group flex items-start gap-3"
                            >
                                <div className="size-12 rounded-xl bg-muted shrink-0 flex items-center justify-center overflow-hidden">
                                    {exercise.image_url ? (
                                        <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Dumbbell className="size-6 text-muted-foreground/50" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{exercise.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                                            {exercise.muscle_group}
                                        </span>
                                        {exercise.type && (
                                            <span className="text-[10px] text-muted-foreground">
                                                • {exercise.type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
