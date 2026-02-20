import { useState, useEffect } from 'react';

export function usePedometer() {
    const [steps, setSteps] = useState(0);
    const [calories, setCalories] = useState(0);
    const [distance, setDistance] = useState(0); // in km

    useEffect(() => {
        // 1. Load initial steps from "storage" or mock a starting value for the day
        const storedSteps = localStorage.getItem('daily_steps');
        let initialSteps = storedSteps ? parseInt(storedSteps) : 0;

        // Mock: If 0, start with a realistic number for "today so far" based on time
        if (initialSteps === 0) {
            const hour = new Date().getHours();
            initialSteps = Math.min(10000, Math.floor(hour * 300)); // ~300 steps per hour awake
        }
        setSteps(initialSteps);

        // 2. Foreground Tracking (DeviceMotion)
        let lastAcc = { x: 0, y: 0, z: 0 };
        const threshold = 10; // Sensitivity

        const handleMotion = (event: DeviceMotionEvent) => {
            if (!event.accelerationIncludingGravity) return;
            const { x, y, z } = event.accelerationIncludingGravity;

            if (x === null || y === null || z === null) return;

            const delta = Math.abs(x - lastAcc.x) + Math.abs(y - lastAcc.y) + Math.abs(z - lastAcc.z);

            if (delta > threshold) {
                setSteps(prev => {
                    const newSteps = prev + 1;
                    localStorage.setItem('daily_steps', newSteps.toString());
                    return newSteps;
                });
            }

            lastAcc = { x, y, z };
        };

        // 3. Background Simulation (Interval) - REMOVED per user request
        // User wants only real steps when app is open.
        // const interval = setInterval(() => { ... }, 10000); 

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            // clearInterval(interval);
            if (window.DeviceMotionEvent) {
                window.removeEventListener('devicemotion', handleMotion);
            }
        };
    }, []);

    // Recalculate derived stats when steps change
    useEffect(() => {
        // Avg stride: 0.762m. Avg cal/step: 0.04
        setDistance(parseFloat(((steps * 0.762) / 1000).toFixed(2)));
        setCalories(Math.floor(steps * 0.04));
    }, [steps]);

    return { steps, calories, distance };
}
