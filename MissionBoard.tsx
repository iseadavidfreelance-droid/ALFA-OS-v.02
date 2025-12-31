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
      
      if (data && Array.isArray(data.data)) {
        setOrphans(data.data);
      } else {
        setOrphans([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Radar Malfunction');
    } finally {
      setLoading(false);
    }
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
      setOrphans(prev => prev.filter(p => p.id !== selectedPin.id));
      setAdoptMessage(`SUCCESS: Mass Transferred. New Rarity: ${data.new_rarity}`);
      setTimeout(() => {
        setSelectedPin(null);
        setAdoptMessage(null);
      }, 2000);
    } catch (err) {
      setAdoptMessage(`FAILURE: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setIsAdopting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-void-black border border-alert-red/30 p-8 flex items-center justify-center animate-pulse">
        <span className="font-mono text-alert-red text-xs tracking-widest">SCANNING LEAK SECTOR...</span>
      </div>
    );
  }

  // SYSTEM NOMINAL
  if (!loading && orphans.length === 0 && !error) {
    return (
      <div className="w-full bg-matrix-green/5 border border-matrix-green/30 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-mono text-matrix-green flex items-center gap-2">
            <span className="w-2 h-2 bg-matrix-green rounded-full animate-pulse"></span>
            LEAK HUNTER: QUIET
          </h2>
          <p className="text-matrix-green/60 text-xs font-mono mt-1">No viral anomalies detected.</p>
        </div>
        <button 
          onClick={runScan}
          className="px-4 py-2 border border-matrix-green/50 text-matrix-green text-xs hover:bg-matrix-green/10 uppercase"
        >
          Ping Radar
        </button>
      </div>
    );
  }

  // WAR ALERT STATE
  return (
    <div className="w-full bg-void-black border-2 border-alert-red p-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
      <div className="flex justify-between items-center mb-6 border-b border-alert-red/30 pb-4">
        <h2 className="text-xl font-bold font-mono text-alert-red flex items-center gap-2 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          WAR ALERT // LEAKS DETECTED ({orphans.length})
        </h2>
        <button onClick={runScan} className="text-xs text-alert-red/70 hover:text-alert-red hover:underline font-mono uppercase">
          [REFRESH]
        </button>
      </div>

      <div className="grid gap-4">
        {orphans.map((pin) => (
          <div key={pin.id} className="bg-alert-red/5 border border-alert-red/40 p-3 flex items-center gap-4 hover:bg-alert-red/10 transition-colors">
             <div className="w-16 h-16 bg-black border border-alert-red/30 shrink-0">
               {pin.image_url && <img src={pin.image_url} className="w-full h-full object-cover opacity-80" alt="Leak" />}
             </div>
             
             <div className="flex-1 min-w-0">
               <div className="flex justify-between mb-1">
                 <span className="text-alert-red font-bold text-xs truncate max-w-[200px]">{pin.title || 'UNKNOWN_SIGNAL'}</span>
                 <span className="text-alert-red font-mono text-xs">{pin.external_pin_id}</span>
               </div>
               <div className="flex gap-4 text-[10px] text-alert-red/70 font-mono">
                 <span>CLICKS: {pin.last_stats.outbound_clicks}</span>
                 <span>IMPRESSIONS: {pin.last_stats.impressions}</span>
               </div>
             </div>

             <button 
                onClick={() => { setSelectedPin(pin); setTargetAssetId(''); setAdoptMessage(null); }}
                className="bg-alert-red text-black font-bold text-xs px-4 py-2 hover:bg-red-400 uppercase tracking-wider"
             >
               ADOPT
             </button>
          </div>
        ))}
      </div>

      {/* ADOPTION MODAL */}
      {selectedPin && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-void-black border-2 border-alert-red w-full max-w-md p-6 shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <h3 className="text-alert-red font-mono text-lg mb-4 border-b border-alert-red/50 pb-2">
              >> CONFIRM ADOPTION
            </h3>
            
            <div className="mb-6 space-y-4">
               <div>
                  <label className="text-xs text-alert-red/60 block mb-1">TARGET SIGNAL</label>
                  <div className="text-alert-red font-mono text-sm border border-alert-red/30 p-2 bg-alert-red/5">
                    {selectedPin.external_pin_id}
                  </div>
               </div>
               <div>
                  <label className="text-xs text-matrix-green/60 block mb-1">DESTINATION ASSET (UUID)</label>
                  <input 
                    autoFocus
                    value={targetAssetId}
                    onChange={(e) => setTargetAssetId(e.target.value)}
                    className="w-full bg-black border border-matrix-green text-matrix-green p-2 font-mono text-sm focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,65,0.3)]"
                    placeholder="ENTER_UUID..."
                  />
               </div>
            </div>

            {adoptMessage && (
               <div className={`mb-4 p-2 text-xs font-mono border ${adoptMessage.includes('SUCCESS') ? 'border-matrix-green text-matrix-green' : 'border-alert-red text-alert-red'}`}>
                 {adoptMessage}
               </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedPin(null)} className="px-4 py-2 text-alert-red/60 border border-alert-red/30 hover:border-alert-red text-xs uppercase">Cancel</button>
              <button onClick={executeAdoption} className="px-4 py-2 bg-alert-red text-black font-bold text-xs uppercase hover:bg-red-500">
                {isAdopting ? 'EXECUTING...' : 'INITIATE TRANSFER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}