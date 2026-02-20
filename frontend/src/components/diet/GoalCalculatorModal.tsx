import { useState, useEffect } from 'react';
import { X, Calculator, ArrowRight, Target } from 'lucide-react';
import api from '../../api/client';

interface GoalCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (calories: number) => void;
    initialData?: { weight?: number; height?: number };
}

export function GoalCalculatorModal({ isOpen, onClose, onApply, initialData }: GoalCalculatorModalProps) {
    const [step, setStep] = useState(1);
    const [weight, setWeight] = useState(initialData?.weight || 70);
    const [height, setHeight] = useState(initialData?.height || 170);
    const [age, setAge] = useState(25);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [activity, setActivity] = useState(1.375); // Light activity default
    const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

    // Reset step when opening
    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    if (!isOpen) return null;

    const calculateCalories = () => {
        // Harris-Benedict Equation
        let bmr = 10 * weight + 6.25 * height - 5 * age;
        bmr += gender === 'male' ? 5 : -161;

        let tdee = bmr * activity;

        if (goal === 'lose') return Math.round(tdee - 500);
        if (goal === 'gain') return Math.round(tdee + 400);
        return Math.round(tdee);
    };

    const finalCalories = calculateCalories();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-card border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h2 className="font-bold flex items-center gap-2">
                        <Calculator className="size-5 text-primary" /> Calculadora Inteligente
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300">
                            <h3 className="text-xl font-bold mb-4">Tus Datos Físicos</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Peso (kg)</label>
                                    <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full bg-muted/50 border border-border rounded-xl p-3 outline-none focus:border-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Altura (cm)</label>
                                    <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full bg-muted/50 border border-border rounded-xl p-3 outline-none focus:border-primary" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Edad</label>
                                    <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="w-full bg-muted/50 border border-border rounded-xl p-3 outline-none focus:border-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Género</label>
                                    <div className="flex bg-muted/50 rounded-xl p-1">
                                        <button onClick={() => setGender('male')} className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition-colors ${gender === 'male' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground'}`}>H</button>
                                        <button onClick={() => setGender('female')} className={`flex-1 rounded-lg py-1.5 text-sm font-bold transition-colors ${gender === 'female' ? 'bg-pink-500 text-white shadow-md' : 'text-muted-foreground'}`}>M</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Nivel de Actividad</label>
                                <select
                                    value={activity}
                                    onChange={(e) => setActivity(Number(e.target.value))}
                                    className="w-full bg-muted/50 border border-border rounded-xl p-3 outline-none focus:border-primary appearance-none cursor-pointer"
                                >
                                    <option value={1.2}>Sedentario (Poco o nada ejercicio)</option>
                                    <option value={1.375}>Ligero (Ejercicio 1-3 días/sem)</option>
                                    <option value={1.55}>Moderado (Ejercicio 3-5 días/sem)</option>
                                    <option value={1.725}>Fuerte (Ejercicio 6-7 días/sem)</option>
                                    <option value={1.9}>Muy Fuerte (Doble entrene/físico)</option>
                                </select>
                            </div>

                            <button onClick={() => setStep(2)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold mt-6 flex items-center justify-center gap-2">
                                Siguiente <ArrowRight className="size-4" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300">
                            <h3 className="text-xl font-bold mb-4">Tu Objetivo</h3>

                            <div className="space-y-2">
                                {[
                                    { id: 'lose', label: 'Perder Grasa', desc: 'Déficit calórico · -500 kcal' },
                                    { id: 'maintain', label: 'Mantenerse', desc: 'Mantenimiento · Normocalórica' },
                                    { id: 'gain', label: 'Ganar Músculo', desc: 'Superávit · +400 kcal' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setGoal(opt.id as any)}
                                        className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${goal === opt.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <div>
                                            <p className={`font-bold ${goal === opt.id ? 'text-primary' : ''}`}>{opt.label}</p>
                                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                        </div>
                                        {goal === opt.id && <Target className="size-5 text-primary" />}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4">
                                <button onClick={() => setStep(3)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                    Ver Resultados <ArrowRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center animate-in zoom-in-95 duration-300">
                            <h3 className="text-xl font-bold mb-2">¡Tu Plan Personalizado!</h3>
                            <p className="text-sm text-muted-foreground mb-6">Basado en tus datos y objetivo.</p>

                            <div className="bg-primary/10 rounded-2xl p-6 mb-6 border border-primary/20">
                                <p className="text-sm font-bold text-primary mb-1">CALORÍAS DIARIAS</p>
                                <p className="text-5xl font-black text-foreground">{finalCalories}</p>
                                <p className="text-xs text-muted-foreground mt-2">Recomendadas</p>
                            </div>

                            <button
                                onClick={async () => {
                                    onApply(finalCalories);
                                    try {
                                        await api.post('/nutrition/goal', { goal: finalCalories });
                                    } catch (e) {
                                        console.error("Error saving goal", e);
                                    }
                                    onClose();
                                }}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                            >
                                Aplicar Objetivo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
