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

  // 1. Initial Scan
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
      
      // Edge Function returns { status: 'success', data: [...] }
      if (data && Array.isArray(data.data)) {
        setOrphans(data.data);
      } else {
        setOrphans([]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Communication breakdown with Scan Satellite.');
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
      setAdoptMessage(`SUCCESS: Traffic Mass (${data.added_traffic_mass}) assimilated. New Rarity: ${data.new_rarity}`);
      
      // Close modal after brief delay to read message
      setTimeout(() => {
        setSelectedPin(null);
        setAdoptMessage(null);
      }, 2000);

    } catch (err) {
      setAdoptMessage(`FAILURE: ${err instanceof Error ? err.message : 'Adoption protocol failed'}`);
    } finally {
      setIsAdopting(false);
    }
  };

  // === RENDER LOGIC ===

  if (loading) {
    return (
      <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 border-4 border-t-emerald-500 border-slate-700 rounded-full animate-spin"></div>
          <span className="font-mono text-emerald-500 text-sm animate-pulse">SCANNING SECTOR FOR ANOMALIES...</span>
        </div>
      </div>
    );
  }

  // SYSTEM NOMINAL STATE (No Alerts)
  if (!loading && orphans.length === 0 && !error) {
    return (
      <div className="w-full bg-slate-950 border border-emerald-900/50 rounded-lg p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
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

  // RED ALERT STATE
  return (
    <div className="w-full bg-slate-950 border border-red-900/50 rounded-lg p-6 shadow-2xl relative">
      <div className="flex justify-between items-center mb-6 border-b border-red-900/30 pb-4">
        <h2 className="text-xl font-bold font-mono text-red-500 flex items-center gap-2 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          CRITICAL ALERT // VIRAL ORPHANS DETECTED ({orphans.length})
        </h2>
        <button 
          onClick={runScan}
          className="text-xs text-red-400 hover:text-white underline decoration-red-800 underline-offset-4"
        >
          [REFRESH SCAN]
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orphans.map((pin) => (
          <div key={pin.id} className="relative bg-red-950/20 border border-red-600 rounded p-4 shadow-[0_0_15px_rgba(220,38,38,0.2)] animate-pulse hover:animate-none transition-all">
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 bg-red-600 text-black font-bold text-[10px] rounded uppercase tracking-wider">
                Unlinked
              </span>
            </div>
            
            <h3 className="font-mono text-red-200 font-bold truncate mb-2 pr-16" title={pin.title || 'Untitled'}>
              {pin.title || 'UNKNOWN_SIGNAL'}
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-red-300/80 mb-4">
               <div className="bg-red-900/20 p-2 rounded border border-red-900/50">
                 <span className="block text-[8px] uppercase">Clicks (Viral)</span>
                 <span className="text-lg font-bold text-white">{pin.last_stats.outbound_clicks ?? 0}</span>
               </div>
               <div className="bg-red-900/20 p-2 rounded border border-red-900/50">
                 <span className="block text-[8px] uppercase">Pin ID</span>
                 <span className="block truncate">{pin.external_pin_id}</span>
               </div>
            </div>

            <button 
              onClick={() => initiateAdoption(pin)}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-black font-bold font-mono uppercase text-xs tracking-widest transition-colors"
            >
              INITIALIZE ADOPTION
            </button>
          </div>
        ))}
      </div>

      {/* ADOPTION MODAL */}
      {selectedPin && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-600 w-full max-w-md p-6 rounded shadow-2xl">
            <h3 className="text-emerald-500 font-mono text-lg mb-4 border-b border-slate-700 pb-2">
              >> TACTICAL ADOPTION PROTOCOL
            </h3>
            
            <div className="mb-4">
              <label className="block text-xs font-mono text-slate-400 mb-1">TARGET: ORPHAN PIN</label>
              <input disabled value={selectedPin.external_pin_id} className="w-full bg-slate-950 border border-slate-800 text-slate-500 p-2 font-mono text-xs" />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-mono text-amber-400 mb-1">DESTINATION: ASSET UUID</label>
              <input 
                autoFocus
                value={targetAssetId}
                onChange={(e) => setTargetAssetId(e.target.value)}
                placeholder="Paste Target Asset UUID here..."
                className="w-full bg-black border border-amber-500/50 text-white p-2 font-mono text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                *Asset stats will be immediately recalculated upon linkage.
              </p>
            </div>

            {adoptMessage && (
               <div className={`mb-4 p-2 text-xs font-mono border ${adoptMessage.includes('SUCCESS') ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'bg-red-900/20 border-red-500 text-red-400'}`}>
                 {adoptMessage}
               </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelAdoption}
                disabled={isAdopting}
                className="px-4 py-2 text-slate-400 font-mono text-xs hover:text-white"
              >
                ABORT
              </button>
              <button 
                onClick={executeAdoption}
                disabled={isAdopting || !targetAssetId}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold font-mono text-xs"
              >
                {isAdopting ? 'LINKING...' : 'CONFIRM LINK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}