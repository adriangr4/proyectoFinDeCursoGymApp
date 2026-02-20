import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Adjust endpoint based on backend structure later
            // Using standard OAuth2 form data usually required by FastAPI's OAuth2PasswordRequestForm
            const formData = new FormData();
            formData.append('username', email); // FastAPI expects 'username' even for email
            formData.append('password', password);

            const response = await api.post('/login/access-token', formData);

            // Assuming response structure: { access_token: "...", token_type: "bearer", user: { ... } }
            // If backend doesn't return user info on login, we might need a second call to /users/me
            const { access_token, user } = response.data;

            // Fallback if user is not in response, try to decode or fetch (mock for now if needed)
            const userData = user || { id: 1, username: 'Adrian', email: email };

            login(access_token, userData);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background decorations */}
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating Dumbbells */}
                <div className="absolute top-10 left-10 text-primary/10 animate-float">
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 5h12v2H6zm0 12h12v2H6zM2 9h20v6H2z" /></svg>
                </div>
                <div className="absolute bottom-20 right-10 text-secondary/10 animate-float-delayed">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 21.29 21.29 19.86l-1.43-1.43 2.14-2.14 1.43 1.43L22 16.29z" /></svg>
                </div>

                {/* Heartbeat Line */}
                <div className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 opacity-5 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                        <path d="M0 50 H900 L910 20 L920 80 L930 50 H1000" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary animate-pulse-slow" />
                    </svg>
                </div>

                {/* Rotating Plates */}
                <div className="absolute -top-20 -right-20 size-96 rounded-full border-[20px] border-primary/5 animate-spin-slow border-dashed"></div>
                <div className="absolute -bottom-20 -left-20 size-80 rounded-full border-[15px] border-secondary/5 animate-spin-slow border-dashed" style={{ animationDirection: 'reverse' }}></div>

                {/* Gradient Mesh */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-0"></div>
            </div>

            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter text-white">
                        Gym<span className="text-primary">Track</span>
                    </h1>
                    <p className="text-muted-foreground">Tu progreso, tu ritmo, tu éxito.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center animate-in shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-white placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="usuario@ejemplo.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-white placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-12"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-blue-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl shadow-[0_0_20px_rgba(19,91,236,0.4)] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin size-5" /> : (
                            <>
                                Entrar <ArrowRight className="size-5" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-primary font-bold hover:underline">
                        Regístrate gratis
                    </Link>
                </p>
            </div>
        </div>
    );
}
