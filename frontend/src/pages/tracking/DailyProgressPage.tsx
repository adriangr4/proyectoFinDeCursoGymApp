import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Footprints, Timer, Activity, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePedometer } from '../../hooks/usePedometer';
import { useEffect, useState } from 'react';
import api from '../../api/client';

export function DailyProgressPage() {
    const navigate = useNavigate();
    const { steps, calories: stepCalories, distance } = usePedometer();
    const [dashboardStats, setStats] = useState<any>(null);

    useEffect(() => {
        api.get('/users/me/dashboard').then(res => setStats(res.data)).catch(console.error);
    }, []);

    const totalCalories = (dashboardStats?.calories_burned || 0) + stepCalories;
    const progress = Math.min(100, (totalCalories / (dashboardStats?.calories_target || 600)) * 100);

    return (
        <div className="min-h-screen bg-transparent pb-20 text-white p-6 pt-8">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-card rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft className="size-6" />
                </button>
                <h1 className="text-2xl font-bold">Resumen Diario</h1>
            </div>

            {/* Main Score Circle */}
            <div className="flex justify-center mb-8">
                <div className="relative size-64">
                    <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                        <motion.circle
                            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                            className="text-primary"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * progress) / 100}
                            initial={{ strokeDashoffset: 283 }}
                            animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <Flame className="size-8 text-orange-500 mb-2 fill-orange-500 animate-pulse" />
                        </motion.div>
                        <span className="text-5xl font-black">{totalCalories}</span>
                        <span className="text-sm text-muted-foreground font-medium">Kcal Quemadas</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                        <Footprints className="size-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{steps.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Pasos Totales</p>
                    </div>
                    <div className="mt-auto pt-2 flex items-center gap-1 text-xs text-blue-400">
                        <Smartphone className="size-3" />
                        <span>Sensor Activo</span>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                        <Activity className="size-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{distance} <span className="text-sm font-normal text-muted-foreground">km</span></p>
                        <p className="text-xs text-muted-foreground">Distancia Recorrida</p>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-3 col-span-2 relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                <Timer className="size-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {Math.floor((dashboardStats?.time_minutes || 0) / 60)}h {(dashboardStats?.time_minutes || 0) % 60}m
                                </p>
                                <p className="text-xs text-muted-foreground">Tiempo de Entrenamiento</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-green-500">+{stepCalories} kcal</p>
                            <p className="text-xs text-muted-foreground">por Pasos</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
