import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Ruler, Save } from 'lucide-react';
import { WeightGraph } from '../../components/profile/WeightGraph';
import api from '../../api/client';

export function PersonalDataPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [weightHistory, setWeightHistory] = useState<any[]>([]);
    const [currentWeight, setCurrentWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bmi, setBmi] = useState<string>('--');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardRes, historyRes] = await Promise.all([
                    api.get('/users/me/dashboard'),
                    api.get('/users/me/weight-history')
                ]);

                if (dashboardRes.data.current_weight) setCurrentWeight(dashboardRes.data.current_weight.toString());
                if (dashboardRes.data.height) setHeight(dashboardRes.data.height.toString());
                setWeightHistory(historyRes.data);

                calculateBMI(dashboardRes.data.current_weight, dashboardRes.data.height);
            } catch (error) {
                console.error("Error fetching personal data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateBMI = (w: number, h: number) => {
        if (!w || !h) {
            setBmi('--');
            return;
        }
        const heightM = h / 100;
        const val = (w / (heightM * heightM)).toFixed(1);
        setBmi(val);
    };

    const handleSave = async () => {
        try {
            if (currentWeight) {
                await api.post('/users/me/weight', {
                    weight: parseFloat(currentWeight),
                    date: new Date().toISOString()
                });
            }
            if (height) {
                await api.put('/users/me', { height: parseInt(height) });
            }

            // Refresh data
            const historyRes = await api.get('/users/me/weight-history');
            setWeightHistory(historyRes.data);
            calculateBMI(parseFloat(currentWeight), parseInt(height));

            // Optional: Show success feedback?
        } catch (error) {
            console.error("Error saving data", error);
        }
    };

    return (
        <div className="w-full bg-transparent text-white p-6 pt-8">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-card rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft className="size-6" />
                </button>
                <h1 className="text-2xl font-bold">Datos Personales</h1>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-card border border-border p-4 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-1">IMC Actual</p>
                    <p className="text-3xl font-black">{bmi}</p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-1">Peso Actual</p>
                    <p className="text-3xl font-black">{currentWeight || '--'} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Historial de Peso</h2>
                <WeightGraph data={weightHistory} />
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                <h2 className="text-xl font-bold mb-2">Actualizar Datos</h2>

                <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Peso (kg)</label>
                    <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
                        <Scale className="size-5 text-muted-foreground" />
                        <input
                            type="number"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            className="bg-transparent w-full outline-none font-bold text-lg"
                            placeholder="0.0"
                            step="0.1"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Altura (cm)</label>
                    <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
                        <Ruler className="size-5 text-muted-foreground" />
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="bg-transparent w-full outline-none font-bold text-lg"
                            placeholder="0"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(19,91,236,0.5)] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    <Save className="size-5" />
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
}
