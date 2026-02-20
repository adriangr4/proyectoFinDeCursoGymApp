import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, ChevronRight, Timer, Egg, Flame, Activity } from 'lucide-react';

import { getDashboardStats, getDashboardStatsCache, type DashboardStats } from '../../services/user';
import { getRoutines, getRoutinesCache } from '../../services/routines';
import { getNutritionCache, setNutritionCache } from '../../services/nutrition';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export function HomePage() {
    const { user } = useAuth();
    const location = useLocation();
    // Initialize with CACHE to avoid flicker
    const [stats, setStats] = useState<DashboardStats | null>(getDashboardStatsCache());
    const [nutrition, setNutrition] = useState<any>(getNutritionCache());

    const [featuredRoutineId, setFeaturedRoutineId] = useState<string | null>(null);
    const [routines, setRoutines] = useState<any[]>(() => {
        const cached = getRoutinesCache();
        return cached || [];
    });

    useEffect(() => {
        // If we have cached routines, set featured ID immediately
        if (routines.length > 0 && !featuredRoutineId) {
            // Prioritize user's selected routine
            if (user?.current_routine_id) {
                const selected = routines.find(r => r.id === user.current_routine_id);
                if (selected) {
                    setFeaturedRoutineId(selected.id);
                    return;
                }
            }
            setFeaturedRoutineId(routines[0].id || null);
        }

        const fetchData = async () => {
            console.log("XXX FETCHING DATA START");
            try {
                // Fetch fresh data in background
                // Fetch fresh data in background with individual error handling
                const [statsRes, nutritionRes, routinesRes] = await Promise.allSettled([
                    getDashboardStats(),
                    api.get('/nutrition/today').then(res => res.data),
                    getRoutines()
                ]);

                // Update state (and thus UI) with fresh data
                if (statsRes.status === 'fulfilled') {
                    setStats(statsRes.value);
                } else {
                    console.error("Dashboard Stats Failed:", statsRes.reason);
                }

                if (nutritionRes.status === 'fulfilled') {
                    console.log("XXX NUTRITION RAW RESPONSE:", nutritionRes.value);
                    setNutrition(nutritionRes.value);
                    setNutritionCache(nutritionRes.value);
                } else {
                    console.error("XXX NUTRITION FETCH FAILED:", nutritionRes.reason);
                }

                let fetchedRoutines: any[] = [];
                if (routinesRes.status === 'fulfilled') {
                    fetchedRoutines = routinesRes.value || [];
                    setRoutines(fetchedRoutines);
                } else {
                    console.error("Routines Fetch Failed:", routinesRes.reason);
                    fetchedRoutines = []; // Keep cached or empty
                }

                if (fetchedRoutines.length > 0) {
                    // Prioritize user's selected routine from fresh data
                    if (user?.current_routine_id) {
                        const selected = fetchedRoutines.find((r: any) => r.id === user.current_routine_id);
                        if (selected) {
                            setFeaturedRoutineId(selected.id);
                            return;
                        }
                    }
                    setFeaturedRoutineId(fetchedRoutines[0].id || null);
                }
                // Don't clear routines if fetch failed, kept from cache or initial

            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [user?.current_routine_id, location.key]); // Refresh on location change

    return (
        <div className="w-full">
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between p-5 bg-background/90 backdrop-blur-md">
                <Link to="/profile" className="flex items-center gap-3">
                    <div className="relative">
                        <div className="size-12 rounded-full bg-center bg-cover border-2 border-primary" style={{ backgroundImage: `url("${user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Adrian'}`}")` }}></div>
                        <div className="absolute bottom-0 right-0 size-3 bg-secondary rounded-full border-2 border-background"></div>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Buenos días,</p>
                        <h2 className="text-xl font-bold leading-none tracking-tight">{user?.username || 'Adrian!'}</h2>
                    </div>
                </Link>
                <button className="relative flex items-center justify-center size-10 rounded-full bg-card text-foreground hover:bg-muted transition-colors border border-border">
                    <span className="sr-only">Notificaciones</span>
                    <div className="size-2 bg-red-500 rounded-full absolute top-2 right-2.5"></div>
                    {/* Replaced Material Symbol with Lucide equivalent or generic bell if mostly standard */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                </button>
            </header>

            {/* Daily Stats - Main Top Component */}
            <main className="flex flex-col gap-6 px-4 pt-6">
                {/* Daily Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <Link to="/progress" className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden group hover:border-primary transition-colors">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-xl -mr-6 -mt-6" />
                        <Activity className="size-6 text-primary mb-2" />
                        <p className="text-2xl font-black">{stats?.steps || 0}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Pasos Hoy</p>
                    </Link>
                    <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-xl -mr-6 -mt-6" />
                        <Flame className="size-6 text-orange-500 mb-2" />
                        {/* Show Consumed / Goal */}
                        <p className="text-2xl font-black">
                            {nutrition?.total_calories || 0}
                            <span className="text-sm font-medium text-muted-foreground">/{nutrition?.goal_calories || 2000}</span>
                        </p>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Kcal (Comidas)</p>

                        {/* Progress Bar for Diet */}
                        <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-orange-500"
                                style={{ width: `${Math.min(100, ((nutrition?.total_calories || 0) / (nutrition?.goal_calories || 1)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Today's Mission Link */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xl font-bold">Misión de Hoy</h2>
                        <Link to="/library" className="text-xs font-semibold text-primary flex items-center gap-0.5">
                            Ver Biblioteca <ChevronRight className="size-4" />
                        </Link>
                    </div>

                    <Link to={featuredRoutineId ? `/workout/${featuredRoutineId}` : "/workout/create"} className="block relative overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(0,0,0,0.2)] group cursor-pointer transition-transform active:scale-[0.99] border border-border">
                        <div className="absolute top-0 right-0 p-4 z-10">
                            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">Alta Intensidad</p>
                            </div>
                        </div>
                        <div className="h-48 w-full bg-cover bg-center relative" style={{ backgroundImage: `url("${stats?.mission_img || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop'}")` }}>
                            <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent"></div>
                        </div>
                        <div className="p-5 relative -mt-12">
                            <h3 className="text-2xl font-bold text-foreground mb-1">{stats?.mission_name || 'Descanso Activo'}</h3>
                            <div className="flex items-center gap-4 text-slate-400 mb-6">
                                <div className="flex items-center gap-1 text-sm">
                                    <Timer className="size-4" />
                                    {stats?.mission_duration || 45} Mins
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                    <DumbbellIcon className="size-4" />
                                    Full Body
                                </div>
                            </div>
                        </div>
                        {featuredRoutineId ? 'Empezar Workout' : 'Explorar Rutinas'}
                    </Link>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xl font-bold">Mis Rutinas</h2>
                        <Link to="/workout/create" className="size-8 flex items-center justify-center rounded-full bg-card text-primary border border-border hover:bg-muted transition-colors">
                            <Plus className="size-5" />
                        </Link>
                    </div>
                    {/* Routine List */}
                    <div className="space-y-3">
                        {routines.map(routine => (
                            <Link key={routine.id} to={`/workout/${routine.id}`} className="block bg-card border border-border rounded-2xl p-4 hover:border-primary transition-colors group">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{routine.name}</h3>
                                    <div className="bg-muted px-2 py-1 rounded-lg text-xs font-bold text-muted-foreground">
                                        {routine.weekly_plan?.filter((d: any) => d.exercises.length > 0).length || 0} Días
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {routine.weekly_plan?.flatMap((d: any) => d.exercises).slice(0, 3).map((ex: any, i: number) => (
                                        <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground truncate max-w-[100px]">
                                            {ex.exercise_id}
                                        </span>
                                    ))}
                                    {(routine.weekly_plan?.flatMap((d: any) => d.exercises).length || 0) > 3 && (
                                        <span className="text-[10px] text-muted-foreground">+{((routine.weekly_plan?.flatMap((d: any) => d.exercises).length || 0) - 3)}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {routines.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No tienes rutinas creadas</p>
                                <p className="text-sm mb-4">¡Crea una nueva para empezar!</p>
                                <Link to="/workout/create" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                                    <Plus className="size-4 mr-2" />
                                    Crear Rutina
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Nutrition Tracker Teaser - Re-added from original, adjusted to use new nutrition structure */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xl font-bold">Nutrición</h2>
                        <Link to="/diet" className="size-8 flex items-center justify-center rounded-full bg-card text-primary border border-border hover:bg-muted transition-colors">
                            <Plus className="size-5" />
                        </Link>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {/* Protein Card */}
                        <div className="min-w-[140px] p-4 rounded-xl bg-card border border-border">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium text-muted-foreground">Proteína</p>
                                <Egg className="text-primary size-5" />
                            </div>
                            <p className="text-xl font-bold mb-3">{Math.round(nutrition?.total_protein || 0)}g <span className="text-xs font-normal text-muted-foreground">consumidos</span></p>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                {/* Estimating 150g goal for now or just visual progress */}
                                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, ((nutrition?.total_protein || 0) / 150) * 100)}%` }}></div>
                            </div>
                        </div>
                        {/* Carbs Card */}
                        <div className="min-w-[140px] p-4 rounded-xl bg-card border border-border">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium text-muted-foreground">Carbs</p>
                                <p className="text-lg">🍞</p>
                            </div>
                            <p className="text-xl font-bold mb-3">{Math.round(nutrition?.total_carbs || 0)}g <span className="text-xs font-normal text-muted-foreground">consumidos</span></p>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, ((nutrition?.total_carbs || 0) / 200) * 100)}%` }}></div>
                            </div>
                        </div>
                        {/* Fats Card */}
                        <div className="min-w-[140px] p-4 rounded-xl bg-card border border-border">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium text-muted-foreground">Grasas</p>
                                <p className="text-lg">🥑</p>
                            </div>
                            <p className="text-xl font-bold mb-3">{Math.round(nutrition?.total_fat || 0)}g <span className="text-xs font-normal text-muted-foreground">consumidos</span></p>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, ((nutrition?.total_fat || 0) / 70) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function DumbbellIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m6.5 6.5 11 11" />
            <path d="m21 21-1-1" />
            <path d="m3 3 1 1" />
            <path d="m18 22 4-4" />
            <path d="m2 6 4-4" />
            <path d="m3 10 7-7" />
            <path d="m14 21 7-7" />
        </svg>
    )
}
