import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Share2, ChefHat, Flame, Plus } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { getNutritionCache, setNutritionCache } from '../../services/nutrition';
import { deleteDiet } from '../../services/diet';
import { shareToCommunity } from '../../services/social';

export function DietDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updateUser } = useAuth(); // Use auth context
    const [diet, setDiet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dietToDelete, setDietToDelete] = useState<string | null>(null);

    // Weekly Logic
    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const [selectedDay, setSelectedDay] = useState(fullDays[todayIndex]);

    // Effect to set initial day if not set or just ensure it matches
    useEffect(() => {
        setSelectedDay(fullDays[new Date().getDay()]);
    }, []);

    useEffect(() => {
        const fetchDiet = async () => {
            if (!id) return;
            try {
                // Check if it's a preset example diet (mocked for now)
                if (id === 'keto-basic') {
                    setDiet({
                        name: 'Keto para Principiantes',
                        daily_calories_target: 1800,
                        meals: [
                            { name: 'Breakfast', foods: [{ name: 'Huevos revueltos', calories: 300 }, { name: 'Aguacate', calories: 160 }] },
                            { name: 'Lunch', foods: [{ name: 'Ensalada de Pollo', calories: 450 }, { name: 'Aceite de Oliva', calories: 120 }] },
                            { name: 'Dinner', foods: [{ name: 'Salmón al horno', calories: 500 }, { name: 'Espárragos', calories: 50 }] }
                        ]
                    });
                } else if (id === 'mediterranean') {
                    setDiet({
                        name: 'Dieta Mediterránea',
                        daily_calories_target: 2000,
                        meals: [
                            { name: 'Breakfast', foods: [{ name: 'Tostada con Tomate', calories: 250 }, { name: 'Café', calories: 10 }] },
                            { name: 'Lunch', foods: [{ name: 'Lentejas guisadas', calories: 600 }, { name: 'Manzana', calories: 80 }] },
                        ]
                    });
                } else if (id === 'high-protein') {
                    setDiet({
                        id: 'high-protein',
                        name: 'Hiperproteica',
                        daily_calories_target: 2500,
                        description: 'Dieta rica en proteínas para el desarrollo muscular.',
                        meals: []
                    });
                }
                else {
                    const res = await api.get(`/diets/${id}`);
                    setDiet(res.data);
                }
            } catch (error) {
                console.error("Error fetching diet details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDiet();
    }, [id]);

    const handleSetActive = async () => {
        try {
            await api.put('/users/me/active_diet', { diet_id: id });
            alert("¡Dieta seleccionada como principal!");
            // Refresh user to update UI state
            if (updateUser) {
                const userRes = await api.get('/users/me');
                updateUser(userRes.data);
            }
        } catch (e) {
            console.error("Error setting active diet", e);
        }
    };

    const handleLogFood = async (food: any, mealName: string) => {
        try {
            const addedCalories = Math.round(food.calories);
            const protein = food.protein || 0;
            const carbs = food.carbs || 0;
            const fat = food.fat || 0;

            // Optimistically update cache before even finishing the request
            // so the back navigation is perfectly instantaneous
            const currentCache = getNutritionCache();
            if (currentCache) {
                setNutritionCache({
                    ...currentCache,
                    total_calories: (currentCache.total_calories || 0) + addedCalories,
                    total_protein: (currentCache.total_protein || 0) + protein,
                    total_carbs: (currentCache.total_carbs || 0) + carbs,
                    total_fat: (currentCache.total_fat || 0) + fat
                });
            }

            const res = await api.post('/nutrition/log', {
                calories: addedCalories,
                protein: protein,
                carbs: carbs,
                fat: fat,
                food_name: food.name,
                meal_type: mealName
            });
            // Update cache with the definitive response from backend
            if (res.data) setNutritionCache(res.data);

            // Custom simplified toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-in fade-in slide-in-from-top-5 font-bold flex items-center gap-2';
            toast.innerHTML = `<span>✅ +${addedCalories} kcal registradas</span>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        } catch (e) {
            console.error(e);
            alert("Error al registrar");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    if (!diet) return <div className="min-h-screen flex items-center justify-center text-white">Dieta no encontrada</div>;

    const isActive = user?.current_diet_id === id;



    const days = [
        { id: 'Monday', label: 'L' },
        { id: 'Tuesday', label: 'M' },
        { id: 'Wednesday', label: 'X' },
        { id: 'Thursday', label: 'J' },
        { id: 'Friday', label: 'V' },
        { id: 'Saturday', label: 'S' },
        { id: 'Sunday', label: 'D' },
    ];

    const handleDeleteDietClick = () => {
        if (!diet?.id) {
            alert("Las plantillas del sistema no se pueden eliminar.");
            return;
        }
        setDietToDelete(diet.id);
    };

    const confirmDeleteDiet = async () => {
        if (!dietToDelete) return;
        try {
            await deleteDiet(dietToDelete);
            navigate('/diet'); // Redirect to diets list
        } catch (e) {
            console.error(e);
            alert("Error al eliminar la dieta");
        } finally {
            setDietToDelete(null);
        }
    };

    const handleShareDiet = async () => {
        if (!diet || !user) return;
        try {
            await shareToCommunity({
                content_type: 'diet',
                content_id: diet.id,
                content_name: diet.name,
                content_image: diet.image_url,
                creator_id: user.id,
                creator_name: user.username || user.email.split('@')[0],
                creator_avatar: user.profilePicture
            });
            alert("¡Dieta compartida con la comunidad!");
        } catch (e: any) {
            console.error("Failed to share", e);
            alert(e.response?.data?.detail || "Error al compartir la dieta. Quizás ya la has compartido.");
        }
    };

    const deleteModal = dietToDelete && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-xl p-6 shadow-2xl border border-border">
                <h3 className="text-xl font-bold mb-2 text-white">Eliminar Dieta</h3>
                <p className="text-muted-foreground mb-6">¿Estás seguro de que deseas eliminar esta dieta permanentemente?</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => setDietToDelete(null)}
                        className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors text-white"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmDeleteDiet}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-md transition-all"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );

    // Determine which meals to show
    let displayMeals = diet?.meals || [];
    let isWeekly = false;

    if (diet?.weekly_plan && diet.weekly_plan.length > 0) {
        isWeekly = true;
        const dayPlan = diet.weekly_plan.find((d: any) => d.day === selectedDay);
        displayMeals = dayPlan?.meals || [];
    }

    // Calculate total calories for the VIEWED day/plan
    const totalCalories = displayMeals.reduce((acc: number, meal: any) =>
        acc + (meal.foods?.reduce((fAcc: number, food: any) => fAcc + (food.calories || 0), 0) || 0), 0
    ) || 0;

    return (
        <div className="w-full text-white p-6 pt-8">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-card rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft className="size-6" />
                </button>
                <div className="flex-1 truncate">
                    <h1 className="text-2xl font-black italic truncate">{diet.name}</h1>
                    {isWeekly && <p className="text-xs text-muted-foreground">Plan Semanal</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {diet.user_id === user?.id && (
                        <>
                            <button
                                onClick={handleShareDiet}
                                className="p-2 rounded-full hover:bg-blue-500/10 text-blue-500 transition-colors"
                                title="Compartir en Comunidad"
                            >
                                <Share2 className="size-5" />
                            </button>
                            <button
                                onClick={handleDeleteDietClick}
                                className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Eliminar Dieta"
                            >
                                <Trash2 className="size-5" />
                            </button>
                        </>
                    )}
                </div>

                {isActive ? (
                    <span className="text-xs font-bold bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/50">ACTIVA</span>
                ) : (
                    <button onClick={handleSetActive} className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/50 hover:bg-primary hover:text-white transition-colors">
                        USAR
                    </button>
                )}
            </header>

            {/* Weekly Day Selector */}
            {isWeekly && (
                <div className="flex justify-between mb-6 bg-card/30 p-1 rounded-2xl">
                    {days.map(day => {
                        const isToday = fullDays[new Date().getDay()] === day.id;
                        return (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDay(day.id)}
                                className={`size-10 rounded-xl flex flex-col items-center justify-center transition-all relative ${selectedDay === day.id
                                    ? 'bg-primary text-white shadow-lg scale-110 z-10'
                                    : 'text-muted-foreground hover:bg-white/5'
                                    }`}
                            >
                                <span className="font-bold">{day.label}</span>
                                {isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current opacity-70"></span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Summary Card */}
            <div className="bg-card border border-border rounded-3xl p-6 mb-8 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="flex justify-between items-end relative z-10">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                            Objetivo {isWeekly ? selectedDay : 'Diario'}
                        </p>
                        <p className="text-3xl font-black">{diet.daily_calories_target} <span className="text-lg text-muted-foreground font-normal">kcal</span></p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-orange-500 mb-1">
                            <Flame className="size-4 fill-orange-500" />
                            <span className="font-bold">{Math.round(totalCalories)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Planificado</p>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-primary to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (totalCalories / diet.daily_calories_target) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Meals List */}
            <div className="space-y-6">
                {displayMeals.map((meal: any, idx: number) => (
                    <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                        <h3 className="font-bold text-lg capitalize mb-3 flex items-center gap-2">
                            <ChefHat className="size-5 text-primary" />
                            {meal.name === 'breakfast' ? 'Desayuno' :
                                meal.name === 'lunch' ? 'Comida' :
                                    meal.name === 'dinner' ? 'Cena' :
                                        meal.name === 'snack' ? 'Snack' : meal.name}
                        </h3>
                        {meal.foods?.length > 0 ? (
                            <div className="space-y-3">
                                {meal.foods.map((food: any, fIdx: number) => (
                                    <div key={fIdx} className="bg-card/50 border border-border/50 rounded-xl p-3 flex justify-between items-center group hover:bg-card transition-colors">
                                        <div className="flex items-center gap-3">
                                            {food.image_url ? (
                                                <img src={food.image_url} alt="" className="size-10 rounded-md object-cover bg-white" />
                                            ) : (
                                                <div className="size-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">img</div>
                                            )}
                                            <div>
                                                <p className="font-bold text-sm">{food.name}</p>
                                                <p className="text-xs text-muted-foreground">{food.brand}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-sm">{Math.round(food.calories)}</p>
                                                <p className="text-[10px] text-muted-foreground">kcal</p>
                                            </div>
                                            <button
                                                onClick={() => handleLogFood(food, meal.name)}
                                                className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <Plus className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic pl-7 border-l-2 border-muted py-1">Sin alimentos para {isWeekly ? selectedDay : 'hoy'}</p>
                        )}
                    </div>
                ))}
            </div>
            {deleteModal}
        </div>
    );
}
