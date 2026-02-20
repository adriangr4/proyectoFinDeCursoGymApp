import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';


export function Layout() {
    return (
        <div className="flex justify-center min-h-screen bg-[#0f1115]">
            <div className="w-full max-w-md min-h-screen bg-background text-foreground relative shadow-2xl overflow-hidden border-x border-white/5">
                {/* Removed TopHeader to avoid duplication with page specific headers */}

                <main className="flex-1 pb-24 h-dvh overflow-y-auto no-scrollbar">
                    <Outlet />
                </main>

                <BottomNav />
            </div>
        </div>
    );
}
