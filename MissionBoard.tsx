import React, { useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

interface MissionBoardProps {
  supabase: SupabaseClient<Database>;
}

interface OrphanPin {
  id: string;
  external_pin_id: string;
  title?: string;
  image_url?: string;
  last_stats: {
    outbound_clicks?: number;
    impressions?: number;
    saves?: number;
  };
}

export default function MissionBoard({ supabase }: MissionBoardProps) {
  const [orphans, setOrphans] = useState<OrphanPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Adoption State
  const [isAdopting, setIsAdopting] = useState(false);
  const [selectedPin, setSelectedPin] = useState<OrphanPin | null>(null);
  const [targetAssetId, setTargetAssetId] = useState('');
  const [adoptMessage, setAdoptMessage] = useState<string | null>(null);

  // 1. Initial Scan (Radar Activo)
  useEffect(() => {
    runScan();
  }, []);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('scan-orphans', {
        method: 'POST',
      });

      if (error) throw error;
      
      // La función retorna { status: 'success', data: [...] }
      // 'data' contiene los red_alerts filtrados por la Edge Function
      if (data && Array.isArray(data.data)) {
        setOrphans(data.data);
      } else {
        setOrphans([]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Radar Malfunction: Cannot scan sector.');
    } finally {
      setLoading(false);
    }
  };

  const initiateAdoption = (pin: OrphanPin) => {
    setSelectedPin(pin);
    setTargetAssetId('');
    setAdoptMessage(null);
  };

  const cancelAdoption = () => {
    setSelectedPin(null);
    setTargetAssetId('');
    setAdoptMessage(null);
  };

  const executeAdoption = async () => {
    if (!selectedPin || !targetAssetId) return;
    
    setIsAdopting(true);
    setAdoptMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('adopt-orphan', {
        body: { pin_id: selectedPin.id, asset_id: targetAssetId }
      });

      if (error) throw error;

      // Success: Remove from local list and show success
      setOrphans(prev => prev.filter(p => p.id !== selectedPin.id));
      setAdoptMessage(`Masa Gravitacional Transferida. (Nueva Rareza: ${data.new_rarity})`);
      
      // Close modal after brief delay to read message
      setTimeout(() => {
        setSelectedPin(null);
        setAdoptMessage(null);
      }, 2000);

    } catch (err) {
      setAdoptMessage(`FAILURE: ${err instanceof Error ? err.message : 'Protocol failed'}`);
    } finally {
      setIsAdopting(false);
    }
  };

  // === RENDER LOGIC ===

  if (loading) {
    return (
      <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 border-4 border-t-red-500 border-r-transparent border-b-red-500 border-l-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-red-500 text-sm animate-pulse tracking-widest">SCANNING HOSTILES...</span>
        </div>
      </div>
    );
  }

  // SYSTEM NOMINAL STATE (No Alerts)
  if (!loading && orphans.length === 0 && !error) {
    return (
      <div className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-6 shadow-lg relative overflow-hidden group transition-all hover:border-emerald-500/50">
        <div className="absolute inset-0 bg-emerald-900/5 pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse"></span>
              SYSTEM STATUS: NOMINAL
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-1">No viral anomalies detected in the orphan sector.</p>
          </div>
          <button 
            onClick={runScan}
            className="px-4 py-2 border border-emerald-800 text-emerald-500 font-mono text-xs hover:bg-emerald-900/50 transition-colors uppercase"
          >
            Re-Scan Sector
          </button>
        </div>
      </div>
    );
  }

  // RED ALERT STATE (Zone de Peligro)
  return (
    <div className="w-full bg-black border-2 border-red-600 rounded-lg p-6 shadow-[0_0_30px_rgba(220,38,38,0.2)] relative animate-[pulse_3s_ease-in-out_infinite]">
      <div className="flex justify-between items-center mb-6 border-b border-red-900/50 pb-4">
        <h2 className="text-xl font-bold font-mono text-red-500 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          CRITICAL ALERT // VIRAL ORPHANS ({orphans.length})
        </h2>
        <button 
          onClick={runScan}
          className="text-xs text-red-400 hover:text-white underline decoration-red-800 underline-offset-4 font-mono"
        >
          [FORCE REFRESH]
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orphans.map((pin) => (
          <div key={pin.id} className="relative bg-red-950/30 border border-red-600 rounded p-4 flex flex-col hover:bg-red-900/20 transition-colors group">
            {/* Visual Header */}
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-0.5 bg-red-600 text-black font-bold text-[10px] rounded uppercase tracking-wider animate-pulse">
                VIRAL
              </span>
              <span className="text-[10px] font-mono text-red-400">{pin.external_pin_id}</span>
            </div>
            
            {/* Image Preview */}
            {pin.image_url ? (
               <div className="h-32 w-full mb-3 overflow-hidden rounded border border-red-900/50 bg-black">
                 <img src={pin.image_url} alt="Target Visual" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
               </div>
            ) : (
              <div className="h-32 w-full mb-3 rounded border border-red-900/50 bg-red-950/50 flex items-center justify-center">
                 <span className="text-[10px] text-red-500 font-mono">NO VISUAL</span>
              </div>
            )}
            
            <h3 className="font-mono text-white text-sm font-bold truncate mb-3" title={pin.title || 'Untitled'}>
              {pin.title || 'UNKNOWN_SIGNAL'}
            </h3>
            
            {/* Stats */}
            <div className="flex items-center gap-2 mb-4 bg-black/50 p-2 rounded border border-red-900/30">
               <div className="flex-1 text-center border-r border-red-900/30">
                 <span className="block text-[8px] text-red-400 uppercase">Clicks</span>
                 <span className="text-xl font-bold text-red-100">{pin.last_stats.outbound_clicks ?? 0}</span>
               </div>
               <div className="flex-1 text-center">
                 <span className="block text-[8px] text-red-400 uppercase">Impr.</span>
                 <span className="text-sm font-bold text-red-200">{pin.last_stats.impressions ?? 0}</span>
               </div>
            </div>

            <button 
              onClick={() => initiateAdoption(pin)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-bold font-mono uppercase text-xs tracking-widest transition-colors shadow-[0_0_10px_rgba(220,38,38,0.4)]"
            >
              ADOPTAR
            </button>
          </div>
        ))}
      </div>

      {/* ADOPTION MODAL */}
      {selectedPin && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-red-500 w-full max-w-md p-6 rounded shadow-[0_0_50px_rgba(220,38,38,0.3)]">
            <h3 className="text-red-500 font-mono text-lg mb-4 border-b border-red-900 pb-2 flex items-center gap-2">
              <span className="animate-pulse">>></span> PROTOCOLO DE ADOPCIÓN
            </h3>
            
            <div className="mb-4">
              <label className="block text-xs font-mono text-slate-400 mb-1">TARGET (PIN ID)</label>
              <input disabled value={selectedPin.external_pin_id} className="w-full bg-slate-950 border border-slate-800 text-slate-500 p-2 font-mono text-xs" />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-mono text-emerald-400 mb-1">DESTINO (ASSET UUID)</label>
              <input 
                autoFocus
                value={targetAssetId}
                onChange={(e) => setTargetAssetId(e.target.value)}
                placeholder="Ingrese Asset ID..."
                className="w-full bg-black border border-emerald-500/50 text-white p-3 font-mono text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 placeholder-slate-700"
              />
              <p className="text-[10px] text-slate-500 mt-2">
                *La masa de tráfico del Pin se sumará instantáneamente al Score del Activo.
              </p>
            </div>

            {adoptMessage && (
               <div className={`mb-4 p-3 text-xs font-mono border ${adoptMessage.includes('Masa') ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'bg-red-900/20 border-red-500 text-red-400'}`}>
                 {adoptMessage}
               </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={cancelAdoption}
                disabled={isAdopting}
                className="px-4 py-2 text-slate-400 font-mono text-xs hover:text-white uppercase"
              >
                Cancelar
              </button>
              <button 
                onClick={executeAdoption}
                disabled={isAdopting || !targetAssetId}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold font-mono text-xs uppercase"
              >
                {isAdopting ? 'TRANSFIRIENDO...' : 'CONFIRMAR TRANSFERENCIA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}