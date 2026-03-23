import { useState, useEffect, useRef } from 'react';
import { Bell, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Link } from 'react-router-dom';

interface Notification {
    id: string;
    type: string;
    message: string;
    actor_name: string;
    actor_avatar?: string;
    read: boolean;
    created_at: string;
}

export function TopHeader() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data);
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };
        fetchNotifications();
        
        // Polling every 60s
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (notifId: string) => {
        try {
            await api.patch(`/notifications/${notifId}/read`);
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
        } catch (e) {
            console.error("Failed to mark as read", e);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read);
        for (const n of unread) {
            await markAsRead(n.id);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between p-5 bg-background/90 backdrop-blur-md">
            <Link to="/profile" className="flex items-center gap-3">
                <div className="relative">
                    <div 
                        className="size-10 rounded-full bg-center bg-cover border-2 border-primary overflow-hidden"
                        style={{ backgroundImage: `url("${user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Adrian'}`}")` }}
                    />
                    <div className="absolute bottom-0 right-0 size-3 bg-secondary rounded-full border-2 border-background"></div>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Buenos días,</p>
                    <h2 className="text-lg font-bold leading-none tracking-tight">{user?.username || 'Adrian!'}</h2>
                </div>
            </Link>
            
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative flex items-center justify-center size-10 rounded-full bg-card text-foreground hover:bg-muted transition-colors border border-border"
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <div className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full"></div>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-[300px] sm:w-[350px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                            <h3 className="font-bold">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors cursor-pointer text-xs flex items-center gap-1">
                                    <CheckSquare className="size-3" />
                                    Marcar leídas
                                </button>
                            )}
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-8 block">No tienes notificaciones</p>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => markAsRead(notif.id)}
                                        className={`flex gap-3 p-4 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${!notif.read ? 'bg-primary/10' : ''}`}
                                    >
                                        <div 
                                            className="size-10 rounded-full bg-cover bg-center shrink-0 border border-border"
                                            style={{ backgroundImage: `url("${notif.actor_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor_name}`}")` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-tight ${!notif.read ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1.5 opacity-80">
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
