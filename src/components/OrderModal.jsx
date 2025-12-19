import { X, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function OrderModal({ isOpen, onClose, orderData, onSubmit }) {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', comments: '' });
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        await onSubmit({ ...formData, ...orderData });
        setSending(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-[#6017b1] p-4 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg">Confirmar Pedido</h3>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Resumen Rápido */}
                <div className="p-6 space-y-4">
                    <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300 grid grid-cols-2 gap-2">
                        <div>📂 Archivo: <span className="text-white truncate block">{orderData.fileName}</span></div>
                        <div>⚖️ Material: <span className="text-white">{orderData.material}</span></div>
                        <div>⏱️ Tiempo: <span className="text-white">{orderData.printTime}</span></div>
                        <div className="col-span-2 font-bold text-[#F1C40F] border-t border-white/10 pt-2 mt-1 flex justify-between">
                            <span>Total Estimado:</span>
                            <span>${orderData.price.toLocaleString('es-CL')}</span>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-white focus:border-[#6017b1] focus:ring-1 focus:ring-[#6017b1] focus:outline-none transition-colors"
                                placeholder="Juan Pérez"
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                            <input
                                required
                                type="email"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-white focus:border-[#6017b1] focus:ring-1 focus:ring-[#6017b1] focus:outline-none transition-colors"
                                placeholder="cliente@ejemplo.com"
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                            <input
                                required
                                type="tel"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-white focus:border-[#6017b1] focus:ring-1 focus:ring-[#6017b1] focus:outline-none transition-colors"
                                placeholder="+56 9 1234 5678"
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full mt-4 bg-[#6017b1] hover:bg-[#4A148C] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-900/20"
                        >
                            {sending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                            {sending ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
