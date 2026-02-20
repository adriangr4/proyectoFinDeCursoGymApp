import { Home, Library, Calendar, User, Settings, Dumbbell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Biblioteca', href: '/library', icon: Library },
    { name: 'Calendario', href: '/tracking', icon: Calendar },
    { name: 'Perfil', href: '/profile', icon: User },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <div className="flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
            <div className="p-6 flex items-center gap-2">
                <div className="bg-primary p-2 rounded-lg">
                    <Dumbbell className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    GymTrack
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                    <Settings className="h-5 w-5" />
                    Configuración
                </Link>
            </div>
        </div>
    );
}
