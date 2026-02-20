import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Settings, Trophy, Activity, ChevronRight, Edit2, Camera, PenLine, History, LayoutDashboard } from 'lucide-react';
import { LevelProgressBar } from '../../components/profile/LevelProgressBar';
import { WorkoutHistoryList } from '../../components/profile/WorkoutHistoryList';
import { getScheduledWorkouts, getScheduledWorkoutsCache } from '../../services/tracking';
import { getRoutines } from '../../services/routines';
import { getExercises } from '../../services/exercises';
import { getDashboardStats, getDashboardStatsCache } from '../../services/user'; // Add cache import
import { motion, AnimatePresence } from 'framer-motion';

export function ProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    // Initialize with CACHE
    const [dashboardStats, setDashboardStats] = useState<any>(getDashboardStatsCache());
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

    // History Data
    const [workouts, setWorkouts] = useState<any[]>(() => {
        const cached = getScheduledWorkoutsCache();
        return cached || [];
    });
    const [routinesMap, setRoutinesMap] = useState<Record<string, any>>({});
    const [exercisesMap, setExercisesMap] = useState<Record<string, any>>({});
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Edit Form States
    const [editUsername, setEditUsername] = useState(user?.username || '');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch fresh data
                const stats = await getDashboardStats();
                setDashboardStats(stats);
            } catch (error) {
                console.error("Error fetching profile stats", error);
            }
        };
        fetchStats();
    }, []);

    // Fetch History Data
    useEffect(() => {
        if (activeTab === 'history') {
            const loadHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    // Parallel fetch
                    const [workoutsData, routinesData, exercisesData] = await Promise.all([
                        getScheduledWorkouts(),
                        getRoutines(),
                        getExercises()
                    ]);

                    setWorkouts(workoutsData);

                    // Create Maps for fast lookup
                    const rMap: Record<string, any> = {};
                    routinesData.forEach(r => rMap[r.id || ''] = r);
                    setRoutinesMap(rMap);

                    const eMap: Record<string, any> = {};
                    exercisesData.forEach(e => eMap[e.id || ''] = e);
                    setExercisesMap(eMap);

                } catch (error) {
                    console.error("Error loading history", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            loadHistory();
        }
    }, [activeTab]);

    // Close settings when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleEditMode = () => {
        if (isEditingProfile) {
            // Saving changes
            if (editUsername !== user?.username) {
                updateUser({ username: editUsername });
            }
        } else {
            setEditUsername(user?.username || '');
        }
        setIsEditingProfile(!isEditingProfile);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateUser({ profilePicture: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full bg-transparent text-white">
            {/* Header */}
            <div className="p-6 pt-12 flex items-center justify-between relative">
                <h1 className="text-3xl font-black italic tracking-tighter">
                    MI <span className="text-primary">PERFIL</span>
                </h1>

                {/* Settings Dropdown */}
                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="p-2 bg-card rounded-full hover:bg-muted transition-colors relative z-20"
                    >
                        <Settings className={`size-6 text-muted-foreground transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-primary' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isSettingsOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                            >
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="size-4" />
                                    <span className="font-medium text-sm">Cerrar Sesión</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Profile Card */}
            <div className="px-6 mb-8">
                <div className="bg-card border border-border rounded-3xl p-6 relative overflow-visible">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />

                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <div className={`size-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary shadow-[0_0_15px_rgba(19,91,236,0.3)] overflow-hidden ${isEditingProfile ? 'ring-4 ring-primary/20' : ''}`}>
                                <img src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Adrian'}`} alt="Profile" className="w-full h-full object-cover" />
                            </div>

                            {/* Camera Icon - Only visible in Edit Mode */}
                            {isEditingProfile && (
                                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg z-10">
                                    <Camera className="size-4" />
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            {isEditingProfile ? (
                                <div className="flex items-center gap-2 border-b border-primary pb-1 mb-1">
                                    <input
                                        type="text"
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        className="bg-transparent font-bold text-xl outline-none w-full"
                                        autoFocus
                                    />
                                    <PenLine className="size-4 text-primary animate-pulse" />
                                </div>
                            ) : (
                                <h2 className="text-xl font-bold">{user?.username || 'Usuario'}</h2>
                            )}

                            <p className="text-muted-foreground text-sm">{user?.email || 'usuario@gymtrack.com'}</p>

                            {!isEditingProfile && (
                                <div className="flex items-center gap-2 mt-1">
                                    {dashboardStats?.rank && (
                                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{dashboardStats.rank}</span>
                                    )}
                                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-bold">Lvl {dashboardStats?.level || 1}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Level Progress */}
                    {dashboardStats && !isEditingProfile && (
                        <div className="mb-4">
                            <LevelProgressBar
                                level={dashboardStats.level}
                                progress={dashboardStats.xp_progress}
                                rank={dashboardStats.rank}
                            />
                        </div>
                    )}

                    <button
                        onClick={toggleEditMode}
                        className={`w-full transition-all py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${isEditingProfile ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-muted hover:bg-slate-800'}`}
                    >
                        {isEditingProfile ? (
                            <>Guardar Cambios</>
                        ) : (
                            <><Edit2 className="size-4" /> Editar Perfil</>
                        )}
                    </button>

                    {isEditingProfile && (
                        <button
                            onClick={() => setIsEditingProfile(false)}
                            className="w-full mt-2 text-muted-foreground text-xs hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-6">
                <div className="bg-muted/50 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'overview'
                            ? 'bg-card shadow-sm text-white'
                            : 'text-muted-foreground hover:text-white'
                            }`}
                    >
                        <LayoutDashboard className="size-4" /> Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history'
                            ? 'bg-card shadow-sm text-white'
                            : 'text-muted-foreground hover:text-white'
                            }`}
                    >
                        <History className="size-4" /> Historial
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="px-6 min-h-[300px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <Trophy className="size-6" />
                                    </div>
                                    <span className="text-2xl font-black">{dashboardStats?.calories_burned ? Math.floor(dashboardStats.calories_burned / 300) : 0}</span>
                                    <span className="text-xs text-muted-foreground">Entrenamientos</span>
                                </div>
                                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
                                    <div className="p-2 bg-secondary/10 rounded-full text-secondary">
                                        <Activity className="size-6" />
                                    </div>
                                    <span className="text-2xl font-black">{dashboardStats?.time_minutes ? Math.floor(dashboardStats.time_minutes / 60) : 0}h</span>
                                    <span className="text-xs text-muted-foreground">Tiempo Total</span>
                                </div>
                            </div>

                            {/* Menu Options */}
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-muted-foreground ml-1 mb-2">CUENTA</p>

                                <Link to="/profile/personal-data">
                                    <div className="w-full bg-card border border-border p-4 rounded-2xl flex items-center justify-between group hover:border-primary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                <UserIcon className="size-5" />
                                            </div>
                                            <span className="font-medium">Datos Personales</span>
                                        </div>
                                        <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {isLoadingHistory ? (
                                <div className="flex justify-center py-12">
                                    <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                </div>
                            ) : (
                                <WorkoutHistoryList
                                    workouts={workouts}
                                    routines={routinesMap}
                                    exercises={exercisesMap}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-6 text-center mt-8">
                <p className="text-xs text-muted-foreground">GymTrack v1.1.0 (Gamified)</p>
            </div>
        </div>
    );
}
