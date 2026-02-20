import { Bell } from 'lucide-react';

export function TopHeader() {
    return (
        <header className="sticky top-0 z-30 flex items-center justify-between p-5 bg-background/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="size-10 rounded-full bg-center bg-cover border-2 border-primary overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Adrian2" alt="Avatar" />
                    </div>
                    <div className="absolute bottom-0 right-0 size-3 bg-secondary rounded-full border-2 border-background"></div>
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-medium">Buenos días,</p>
                    <h2 className="text-lg font-bold leading-none tracking-tight">Adrian!</h2>
                </div>
            </div>
            <button className="relative flex items-center justify-center size-10 rounded-full bg-card text-foreground hover:bg-muted transition-colors border border-border">
                <Bell className="size-5" />
                <div className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full"></div>
            </button>
        </header>
    );
}
