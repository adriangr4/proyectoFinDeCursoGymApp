import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface WeightLog {
    id: string;
    weight: number;
    date: string;
}

interface WeightGraphProps {
    data: WeightLog[];
}

export function WeightGraph({ data }: WeightGraphProps) {
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    if (sortedData.length < 2) {
        return (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-xl">
                Registra al menos 2 pesos para ver la gráfica
            </div>
        );
    }

    // Calculations for scaling
    const weights = sortedData.map(d => d.weight);
    const minWeight = Math.min(...weights) - 1;
    const maxWeight = Math.max(...weights) + 1;
    const range = maxWeight - minWeight;

    const getX = (index: number) => (index / (sortedData.length - 1)) * 100;
    const getY = (weight: number) => 100 - ((weight - minWeight) / range) * 100;

    const points = sortedData.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(' ');

    return (
        <div className="w-full h-48 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map((y, i) => (
                    <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                ))}

                {/* Line Path */}
                <motion.path
                    d={`M ${points}`}
                    fill="none"
                    stroke="currentColor" // Uses text color (adjust via parent class)
                    strokeWidth="2"
                    className="text-primary"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Area under the line (Gradient) */}
                <defs>
                    <linearGradient id="gradientArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" className="text-primary" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
                    </linearGradient>
                </defs>
                <motion.path
                    d={`M ${points} L 100,100 L 0,100 Z`}
                    fill="url(#gradientArea)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                />

                {/* Points */}
                {sortedData.map((d, i) => (
                    <motion.circle
                        key={d.id}
                        cx={getX(i)}
                        cy={getY(d.weight)}
                        r="1.5"
                        fill="white"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                    />
                ))}
            </svg>

            {/* Labels (Last date and weight) */}
            <div className="absolute top-2 right-2 flex flex-col items-end">
                <span className="text-xl font-bold">{sortedData[sortedData.length - 1].weight} kg</span>
                <span className="text-xs text-muted-foreground">Último registro</span>
            </div>
        </div>
    );
}
