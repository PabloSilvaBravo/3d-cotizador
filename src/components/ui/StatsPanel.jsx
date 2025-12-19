import React from 'react';
import { Clock, Box, Scale, Layers } from 'lucide-react';

export default function StatsPanel({ stats }) {
    if (!stats) return null;

    const { volumen, soporte, peso, dimensiones, tiempo } = stats;

    const StatRow = ({ icon: Icon, label, value, subValue }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-brand-primary">
                    <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <div className="text-right">
                <p className="text-brand-text font-bold text-sm">{value}</p>
                {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
            <h3 className="text-brand-dark font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-brand-primary rounded-full block"></span>
                Estadísticas del Modelo
            </h3>
            <div className="space-y-1">
                <StatRow icon={Layers} label="Volumen Material" value={`${volumen.toFixed(2)} cm³`} />
                <StatRow icon={Box} label="Soporte Est." value={`${soporte.toFixed(2)} cm³`} subValue={soporte < 0.1 ? "Mínimo" : "Requerido"} />
                <StatRow icon={Scale} label="Peso Total" value={`${peso.toFixed(2)} g`} />
                <StatRow icon={Box} label="Dimensiones" value={`${dimensiones.x.toFixed(1)} x ${dimensiones.y.toFixed(1)} x ${dimensiones.z.toFixed(1)} cm`} />

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-brand-primary" />
                            <span className="text-sm font-bold text-brand-dark">Tiempo Aprox.</span>
                        </div>
                        <span className="text-xl font-mono font-bold text-brand-primary">{tiempo}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
