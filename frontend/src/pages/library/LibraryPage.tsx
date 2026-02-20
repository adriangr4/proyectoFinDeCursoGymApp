import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRoutines, deleteRoutine, type Routine } from '../../services/routines';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Pencil, Timer, Flame, BarChart, Info, Play, Calendar, Star, Dumbbell, Plus, Trash2, Share2 } from 'lucide-react';
import { shareToCommunity } from '../../services/social';

export function LibraryPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const { user, updateUser } = useAuth(); // Add hook

  useEffect(() => {
    getRoutines()
      .then(setRoutines)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSetGlobalRoutine = async (routineId: string) => {
    try {
      await updateUser({ current_routine_id: routineId });
      // Optional toast
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutineToDelete(routineId);
  };

  const confirmDeleteRoutine = async () => {
    if (!routineToDelete) return;
    try {
      await deleteRoutine(routineToDelete);
      setRoutines(prev => prev.filter(r => r.id !== routineToDelete));
      if (selectedRoutine?.id === routineToDelete) setSelectedRoutine(null);
    } catch (e) {
      console.error(e);
      alert("Error al eliminar la rutina");
    } finally {
      setRoutineToDelete(null);
    }
  };

  const handleShareRoutine = async () => {
    if (!selectedRoutine || !user) return;
    try {
      await shareToCommunity({
        content_type: 'routine',
        content_id: selectedRoutine.id!,
        content_name: selectedRoutine.name,
        creator_id: user.id,
        creator_name: user.username || user.email.split('@')[0],
        creator_avatar: user.profilePicture
      });
      alert("¡Rutina compartida con la comunidad!");
    } catch (e: any) {
      console.error("Failed to share", e);
      alert(e.response?.data?.detail || "Error al compartir la rutina. Quizás ya la has compartido.");
    }
  };

  const deleteModal = routineToDelete && (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-xl p-6 shadow-2xl border border-border">
        <h3 className="text-xl font-bold mb-2 text-white">Eliminar Rutina</h3>
        <p className="text-muted-foreground mb-6">¿Estás seguro de que deseas eliminar esta rutina permanentemente?</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setRoutineToDelete(null)}
            className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors text-white"
          >
            Cancelar
          </button>
          <button
            onClick={confirmDeleteRoutine}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-md transition-all"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  // --- DETAIL VIEW (Matches RoutineDetails from code.html) ---
  if (selectedRoutine) {
    const isCurrent = user?.current_routine_id === selectedRoutine.id;

    return (
      <div className="flex flex-col w-full bg-background animate-in slide-in-from-right duration-300">
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-background/95 backdrop-blur-md border-b border-border/40">
          <button
            onClick={() => setSelectedRoutine(null)}
            className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-6" />
          </button>
          <h2 className="text-lg font-bold tracking-tight truncate max-w-[200px]">{selectedRoutine.name}</h2>
          <div className="flex gap-2">
            {selectedRoutine.creator_id === user?.id && (
              <>
                <button
                  onClick={handleShareRoutine}
                  className="flex items-center justify-center size-10 rounded-full hover:bg-blue-500/10 text-blue-500 transition-colors"
                  title="Compartir en Comunidad"
                >
                  <Share2 className="size-5" />
                </button>
                <button
                  onClick={() => handleDeleteRoutine(selectedRoutine.id || '')}
                  className="flex items-center justify-center size-10 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                  title="Eliminar Rutina"
                >
                  <Trash2 className="size-5" />
                </button>
              </>
            )}
            <button
              onClick={() => handleSetGlobalRoutine(selectedRoutine.id || '')}
              className={`flex items-center justify-center size-10 rounded-full transition-colors ${isCurrent ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
              title={isCurrent ? "Rutina Actual" : "Marcar como Actual"}
            >
              <Star className={`size-5 ${isCurrent ? 'fill-current' : ''}`} />
            </button>
            <button className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors text-primary">
              <Pencil className="size-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar">
          {/* Progress Section */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-muted-foreground">Progreso Rutina</span>
              <span className="text-primary font-bold">0%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[5%] rounded-full"></div>
            </div>
          </div>

          {/* Routine Header Info */}
          <div className="px-6 py-6">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
              {selectedRoutine.name}
            </h1>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
                <Timer className="size-4 text-primary" />
                <span className="text-sm font-medium">60 Min</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
                <BarChart className="size-4 text-primary" />
                <span className="text-sm font-medium">Intermedio</span>
              </div>
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-sm">
                <Flame className="size-4 text-primary" />
                <span className="text-sm font-medium">450 kcal</span>
              </div>
            </div>

            {isCurrent && (
              <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                <Star className="size-4 fill-current" />
                Rutina Seleccionada
              </div>
            )}

            <p className="mt-6 text-muted-foreground leading-relaxed text-sm">
              {selectedRoutine.description || "Enfócate en la técnica y el control. Descansa 90-120 segundos entre series compuestas."}
            </p>
          </div>

          {/* Exercises List Header */}
          <div className="px-6 py-2 flex items-center justify-between">
            <h3 className="text-lg font-bold">Ejercicios ({(selectedRoutine.exercises || []).length})</h3>
            <button className="text-xs font-semibold text-primary uppercase tracking-wider">Reordenar</button>
          </div>

          {/* Exercise Cards */}
          {/* Exercises List (Grouped by Day) */}
          <div className="flex flex-col gap-6 px-4 mt-2">
            {/* Group exercises by day */}
            {(() => {
              const grouped = (selectedRoutine.exercises || []).reduce((acc: any, curr: any) => {
                const day = curr.day_of_week || 1;
                if (!acc[day]) acc[day] = [];
                acc[day].push(curr);
                return acc;
              }, {} as Record<number, typeof selectedRoutine.exercises>);

              return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([day, exercises]) => (
                <div key={day} className="space-y-3">
                  <div className="flex items-center gap-2 pl-2">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Día {day}
                    </div>
                    <div className="h-px bg-border flex-1 ml-2"></div>
                  </div>

                  {(exercises as any[]).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="group relative flex items-center gap-4 bg-card p-3 rounded-2xl border border-border shadow-sm hover:border-primary/50 transition-all cursor-pointer">
                      {/* Thumbnail */}
                      <div className="shrink-0 size-16 rounded-xl bg-muted overflow-hidden relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/10 z-10"></div>
                        <Dumbbell className="text-muted-foreground/50 size-6 relative z-0" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold truncate pr-2">{item.exercise.name}</h4>
                          <Info className="size-4 text-muted-foreground hover:text-primary" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-1.5">{item.exercise.muscle_group}</p>
                        <div className="flex items-center gap-2">
                          <div className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">
                            {item.target_sets} Series
                          </div>
                          <div className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">
                            {item.target_reps_min}-{item.target_reps_max} Reps
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-amber-500 font-medium truncate max-w-[100px]">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        </main>

        {/* Fixed Footer CTA */}
        <div className="fixed bottom-0 left-0 w-full z-40 p-4 bg-linear-to-t from-background via-background to-transparent pt-12 pb-24 md:pb-8">
          <Link to={`/workout/${selectedRoutine.id}`} className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white text-lg font-bold py-4 rounded-full shadow-[0_0_20px_rgba(19,91,236,0.3)] transition-all">
            <Play className="fill-current size-5" />
            Empezar Entrenamiento
          </Link>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="px-4 pt-2 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Rutinas</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {routines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <Dumbbell className="size-12 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No hay rutinas en la biblioteca</p>
            <p className="text-sm mb-6">Crea tu primera rutina personalizada</p>
            <Link to="/workout/create" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95">
              <div className="mr-2 bg-white/20 p-1 rounded-full">
                <Plus className="size-4" />
              </div>
              Crear Nueva Rutina
            </Link>
          </div>
        ) : (
          routines.map((routine) => {
            // Visual mapping
            let bgImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop';
            if (routine.name.toLowerCase().includes('ppl') || routine.name.toLowerCase().includes('push')) bgImage = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop';
            if (routine.name.toLowerCase().includes('arnold')) bgImage = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000&auto=format&fit=crop';
            if (routine.name.toLowerCase().includes('full')) bgImage = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop';

            return (
              <div
                key={routine.id}
                onClick={() => setSelectedRoutine(routine)}
                className="group relative h-48 w-full rounded-3xl overflow-hidden cursor-pointer shadow-lg border border-border"
              >
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent z-10" />
                <img src={bgImage} alt={routine.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

                <div className="absolute bottom-0 left-0 w-full p-5 z-20">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{routine.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded backdrop-blur-md border border-white/10">
                      <Calendar className="size-3" />
                      <span>{new Set((routine.exercises || []).map((e: any) => e.day_of_week)).size} Días</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded backdrop-blur-md border border-white/10">
                      <Star className="size-3 text-yellow-400 fill-yellow-400" />
                      <span>{routine.average_rating ? routine.average_rating.toFixed(1) : '5.0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        to="/workout/create"
        className="fixed bottom-24 right-6 size-14 bg-primary hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(19,91,236,0.3)] hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus className="size-6" />
      </Link>

      {deleteModal}
    </div>
  );
}
