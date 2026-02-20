import { Home, Dumbbell, Utensils, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function BottomNav() {
    const location = useLocation();
    const currentPath = location.pathname;

    // Helper to determine if a route is active (simple check)
    const isActive = (path: string) => currentPath === path;

    return (
        <nav className="fixed bottom-6 left-4 right-4 z-50">
            <div className="h-16 rounded-full bg-[#1c2538]/95 backdrop-blur-lg shadow-lg border border-white/5 flex items-center justify-between px-2">
                {/* Home */}
                <Link to="/" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/') ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-slate-400"
                    )}>
                        <Home className={cn("size-6", isActive('/') && "fill-current")} />
                    </div>
                </Link>

                {/* Routines */}
                <Link to="/library" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/library') ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-slate-400"
                    )}>
                        <Dumbbell className={cn("size-6", isActive('/library') && "fill-current")} />
                    </div>
                </Link>

                {/* REMOVED QR CODE AS REQUESTED */}

                {/* Diet */}
                <Link to="/diet" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/diet') ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-slate-400"
                    )}>
                        <Utensils className={cn("size-6", isActive('/diet') && "fill-current")} />
                    </div>
                </Link>

                {/* Community */}
                <Link to="/community" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/community') ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-slate-400"
                    )}>
                        <Users className={cn("size-6", isActive('/community') && "fill-current")} />
                    </div>
                </Link>
            </div>
        </nav>
    );
}
