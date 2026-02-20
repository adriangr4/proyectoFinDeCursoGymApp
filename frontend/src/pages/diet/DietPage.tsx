import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChefHat, Flame } from 'lucide-react';
import { getDiets, getDietsCache } from '../../services/diet';
import { useAuth } from '../../context/AuthContext';

import { getRoutinesCache } from '../../services/routines';

export function DietPage() {
    const { user } = useAuth();
    // Initialize with CACHE to avoid flicker
    const [userDiets, setUserDiets] = useState<any[]>(() => {
        const cached = getDietsCache();
        return cached || [];
    });

    // Dynamic Calorie Target Logic
    // Try to find if the user has an active routine with a calorie target,
    // or an active diet, otherwise fallback to their profile goal
    const routines = getRoutinesCache() || [];
    const activeRoutine = routines.find(r => r.id === user?.current_routine_id);
    const activeDiet = userDiets.find(d => d.id === user?.current_diet_id);

    const dynamicCalorieGoal = activeRoutine?.daily_calories_target
        || activeDiet?.daily_calories_target
        || activeDiet?.total_calories
        || user?.daily_calorie_goal
        || 2000;

    useEffect(() => {
        const fetchDiets = async () => {
            try {
                // Fetch fresh data
                const diets = await getDiets();
                setUserDiets(diets);
            } catch (error) {
                console.error("Error fetching diets", error);
            }
        };
        fetchDiets();
    }, []);

    const exampleDiets = [
        {
            id: 'keto-basic',
            name: 'Keto para Principiantes',
            desc: 'Alta en grasas, baja en carbohidratos.',
            img: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop',
            cals: 1800
        },
        {
            id: 'mediterranean',
            name: 'Dieta Mediterránea',
            desc: 'Equilibrada y saludable, rica en vegetales.',
            img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop',
            cals: 2000
        },
        {
            id: 'high-protein',
            name: 'Hiperproteica (Volumen)',
            desc: 'Para ganar masa muscular limpia.',
            img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1000&auto=format&fit=crop',
            cals: 2500
        }
    ];

    return (
        <div className="w-full text-white p-6 pt-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black italic">TU DIETA</h1>
                    <p className="text-muted-foreground text-sm font-medium">Planifica tus macros</p>
                </div>
                <Link to="/diet/create" className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                    <Plus className="size-6" />
                </Link>
            </header>

            {/* Goal Card */}
            <div className="mb-8 p-6 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Tu Objetivo Diario</p>
                    <h2 className="text-4xl font-black text-white">{dynamicCalorieGoal} <span className="text-lg font-medium text-white/70">kcal</span></h2>

                    <div className="mt-4 flex gap-4">
                        <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            <span className="block text-xs text-white/70">Proteína</span>
                            <span className="font-bold text-sm">~{(dynamicCalorieGoal * 0.3 / 4).toFixed(0)}g</span>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            <span className="block text-xs text-white/70">Carbs</span>
                            <span className="font-bold text-sm">~{(dynamicCalorieGoal * 0.4 / 4).toFixed(0)}g</span>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            <span className="block text-xs text-white/70">Grasas</span>
                            <span className="font-bold text-sm">~{(dynamicCalorieGoal * 0.3 / 9).toFixed(0)}g</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <ChefHat className="absolute bottom-4 right-4 text-white/20 size-24 -rotate-12" />
            </div>

            {/* My Plans Section */}
            {userDiets.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ChefHat className="size-5 text-primary" /> Mis Planes
                    </h2>
                    <div className="grid gap-4">
                        {userDiets.map(diet => {
                            const kcals = diet.total_calories || diet.daily_calories_target;
                            const fallbackImage = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop';

                            return (
                                <Link key={diet.id} to={`/diet/${diet.id}`} className="relative h-40 rounded-2xl overflow-hidden group cursor-pointer border border-transparent hover:border-primary/50 transition-all block shadow-md">
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105 duration-500" style={{ backgroundImage: `url("${diet.image_url || fallbackImage}")` }} />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

                                    <div className="absolute bottom-0 left-0 p-4 w-full">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{diet.name}</h3>
                                                <p className="text-xs text-gray-300 line-clamp-1">{diet.meals?.length || 0} Comidas listadas</p>
                                            </div>
                                            <div className="bg-primary/90 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                                                {kcals} kcal
                                            </div>
                                        </div>
                                    </div>
                                    {user?.current_diet_id === diet.id && (
                                        <div className="absolute top-3 right-3 bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm border border-green-400">
                                            ACTIVA
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Example Diets */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Flame className="size-5 text-orange-500" /> Populares
                    </h2>
                </div>

                <div className="grid gap-4">
                    {exampleDiets.map(diet => (
                        <Link key={diet.id} to={`/diet/${diet.id}`} className="relative h-40 rounded-2xl overflow-hidden group cursor-pointer border border-transparent hover:border-primary/50 transition-all block">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105 duration-500" style={{ backgroundImage: `url("${diet.img}")` }} />
                            <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-4 w-full">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{diet.name}</h3>
                                        <p className="text-xs text-gray-300 line-clamp-1">{diet.desc}</p>
                                    </div>
                                    <div className="bg-primary/90 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                                        {diet.cals} kcal
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
