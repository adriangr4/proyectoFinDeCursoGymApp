import { Home, Dumbbell, Utensils, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export function BottomNav() {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                setIsKeyboardVisible(true);
            }
        };

        const handleFocusOut = () => {
            setIsKeyboardVisible(false);
        };

        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    // Helper to determine if a route is active (simple check)
    const isActive = (path: string) => currentPath === path;

    const mainPaths = ['/', '/library', '/diet', '/community', '/profile'];
    if (!mainPaths.includes(currentPath)) return null;

    return (
        <nav className={cn(
            "fixed left-4 right-4 z-40 transition-all duration-300 ease-in-out",
            isKeyboardVisible ? "-bottom-24 opacity-0 pointer-events-none" : "bottom-6 opacity-100"
        )}>
            <div className="h-16 rounded-full bg-card/95 backdrop-blur-lg shadow-lg border border-border flex items-center justify-between px-2">
                {/* Home */}
                <Link to="/" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/') ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"
                    )}>
                        <Home className={cn("size-6", isActive('/') && "fill-current")} />
                    </div>
                </Link>

                {/* Routines */}
                <Link to="/library" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/library') ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"
                    )}>
                        <Dumbbell className={cn("size-6", isActive('/library') && "fill-current")} />
                    </div>
                </Link>

                {/* Diet */}
                <Link to="/diet" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/diet') ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"
                    )}>
                        <Utensils className={cn("size-6", isActive('/diet') && "fill-current")} />
                    </div>
                </Link>

                {/* Community */}
                <Link to="/community" className="flex-1 flex flex-col items-center justify-center gap-1 group">
                    <div className={cn(
                        "size-10 rounded-full flex items-center justify-center transition-all",
                        isActive('/community') ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"
                    )}>
                        <Users className={cn("size-6", isActive('/community') && "fill-current")} />
                    </div>
                </Link>
            </div>
        </nav>
    );
}
