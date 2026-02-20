import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, Star, ArrowRight } from 'lucide-react';

interface LevelUpOverlayProps {
    isVisible: boolean;
    onClose: () => void;
    xpGained: number;
    currentLevel: number;
    initialXp: number; // XP before workout
    finalXp: number;   // XP after workout
    nextLevelXp: number; // XP needed for next level (total)
    prevLevelXp: number; // XP needed for current level (total)
}

export function LevelUpOverlay({
    isVisible,
    onClose,
    xpGained,
    currentLevel,
    initialXp,
    finalXp,
    nextLevelXp,
    prevLevelXp
}: LevelUpOverlayProps) {
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [displayedXp, setDisplayedXp] = useState(initialXp);

    // Calculate progress percentages
    // Level N range is [prevLevelXp, nextLevelXp]
    const levelRange = nextLevelXp - prevLevelXp;

    // Guard against division by zero if level 1 starts at 0 and ends at 100
    const safeRange = levelRange > 0 ? levelRange : 100;

    // Start progress (before workout)
    // If we leveled up from previous level, initialXp was in previous range.
    // For simplicity, let's assume valid range logic or clamp.
    // Ideally, if we leveled up, start should be 0 (relative to new level)? 
    // No, better visual: Bar fills from old % to 100%, then new bar fills?
    // MVP: Just show current state. 
    // If we just entered this level, initialXp might be < prevLevelXp? 
    // Wait, initialXp is raw total.

    // If we JUST leveled up, our initial XP was below prevLevelXp of the NEW level.
    // So startProgress would be negative.
    // In that case, start at 0.
    const startProgress = Math.max(0, Math.min(100, ((initialXp - prevLevelXp) / safeRange) * 100));

    const leveledUp = finalXp >= nextLevelXp;
    const finalProgress = leveledUp
        ? 100
        : Math.min(100, Math.max(0, ((finalXp - prevLevelXp) / safeRange) * 100));

    useEffect(() => {
        if (isVisible) {
            // Animate XP counter
            const duration = 2000;
            const startTime = Date.now();

            const animate = () => {
                const now = Date.now();
                const progress = Math.min(1, (now - startTime) / duration);
                const currentVal = Math.floor(initialXp + (xpGained * progress));
                setDisplayedXp(currentVal);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Check level up triggering
                    // If we are at 100% or overflow, show level up? 
                    // Actually passing explicit 'leveledUp' prop might be better but checking range is ok
                    if (finalXp >= nextLevelXp) {
                        setTimeout(() => setShowLevelUp(true), 500);
                    }
                }
            };
            requestAnimationFrame(animate);
        }
    }, [isVisible, initialXp, xpGained, finalXp, nextLevelXp, leveledUp]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white"
                >
                    {/* Background Particles/Glow */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-700" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="relative z-10 w-full max-w-md text-center space-y-8"
                    >
                        {/* Header */}
                        <div className="space-y-2">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-yellow-500"
                            >
                                <Trophy className="size-4" />
                                <span>¡Entrenamiento Completado!</span>
                            </motion.div>
                            <h2 className="text-4xl font-black italic tracking-tighter">
                                +{xpGained} <span className="text-primary">XP</span>
                            </h2>
                        </div>

                        {/* XP Bar */}
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                            {/* Level Badge */}
                            <div className="flex justify-between items-end mb-4">
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Nivel Actual</span>
                                    <span className="text-2xl font-black">{currentLevel}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Siguiente</span>
                                    <span className="text-2xl font-black text-muted-foreground">{currentLevel + 1}</span>
                                </div>
                            </div>

                            {/* Progress Bar Container */}
                            <div className="h-6 bg-muted rounded-full overflow-hidden relative border border-white/5">
                                {/* Fill Animation */}
                                <motion.div
                                    className="absolute top-0 left-0 h-full bg-linear-to-r from-primary to-blue-400"
                                    initial={{ width: `${startProgress}%` }}
                                    animate={{ width: `${finalProgress}%` }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                    <div className="absolute right-0 top-0 h-full w-1 bg-white/50 shadow-[0_0_10px_white]" />
                                </motion.div>
                            </div>

                            <div className="mt-2 flex justify-between text-xs font-mono text-muted-foreground">
                                <span>{displayedXp} XP Total</span>
                                <span>{nextLevelXp} XP Meta</span>
                            </div>

                            {/* Level Up Notification */}
                            <AnimatePresence>
                                {showLevelUp && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm rounded-3xl"
                                    >
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                        >
                                            <Star className="size-16 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                                        </motion.div>
                                        <h3 className="text-3xl font-black text-white mt-4 tracking-tighter drop-shadow-lg">
                                            LEVEL <span className="text-primary">UP!</span>
                                        </h3>
                                        <motion.p
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-lg font-bold text-gray-300 mt-2"
                                        >
                                            ¡Nivel {currentLevel + 1} Alcanzado!
                                        </motion.p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Continue Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.5 }}
                            onClick={onClose}
                            className="w-full py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg cursor-pointer"
                        >
                            <span>Continuar</span>
                            <ArrowRight className="size-5" />
                        </motion.button>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
