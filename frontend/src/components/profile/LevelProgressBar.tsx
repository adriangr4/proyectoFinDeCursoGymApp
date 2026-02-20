import { motion } from 'framer-motion';

interface LevelProgressBarProps {
    level: number;
    progress: number; // 0 to 100
    rank: string;
}

export function LevelProgressBar({ level, progress, rank }: LevelProgressBarProps) {
    // Rank colors
    const getRankColor = (rank: string) => {
        switch (rank.toLowerCase()) {
            case 'bronze': return 'from-orange-700 to-orange-400';
            case 'silver': return 'from-slate-400 to-slate-200';
            case 'gold': return 'from-yellow-600 to-yellow-300';
            case 'platinum': return 'from-cyan-600 to-cyan-300';
            case 'diamond': return 'from-blue-600 to-blue-300';
            case 'champion': return 'from-purple-600 to-purple-300';
            default: return 'from-primary to-primary/50';
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider bg-clip-text text-transparent bg-linear-to-r ${getRankColor(rank)}`}>
                    {rank} League
                </span>
                <span className="text-xs text-muted-foreground">{progress}% XP</span>
            </div>
            <div className="h-4 bg-muted/50 rounded-full overflow-hidden relative">
                <motion.div
                    className={`h-full rounded-full bg-linear-to-r ${getRankColor(rank)} relative overflow-hidden`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                </motion.div>
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-bold">Lvl {level}</span>
                <span className="text-xs text-muted-foreground">Lvl {level + 1}</span>
            </div>
        </div>
    );
}
