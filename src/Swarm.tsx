import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { useTacticalActions } from './hooks/useTacticalActions';

type AssetRow = Database['public']['Tables']['assets']['Row'];
type PinRow = {
  id: string;
  asset_id: string | null;
  last_stats: any; // JSONB
  last_synced_at: string | null;
};

interface SwarmProps {
  assets: AssetRow[];
}

// === SUPABASE CLIENT (Local Instance) ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// === VISUAL CONSTANTS ===
const RARITY_COLORS: Record<string, string> = {
  COMMON: '#94a3b8',   // slate-400
  UNCOMMON: '#34d399', // emerald-400
  RARE: '#60a5fa',     // blue-400
  EPIC: '#c084fc',     // purple-400
  LEGENDARY: '#fbbf24' // amber-400
};

export default function Swarm({ assets }: SwarmProps) {
  const { assimilateOrphan, isLoading: isActionLoading } = useTacticalActions();

  // === STATE ===
  const [allPins, setAllPins] = useState<PinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  // === FETCH DATA ===
  const fetchPins = async () => {
    setLoading(true);
    // Fetch pins. Note: orphans (null asset_id) are usually handled in MissionBoard, 
    // but if fetched here, the new tooltip logic will handle them.
    const { data, error } = await supabase
      .from('pins')
      .select('id, asset_id, last_stats, last_synced_at')
      .not('asset_id', 'is', null);

    if (data && !error) {
      setAllPins(data as PinRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPins();
  }, []);

  // === LOGIC: PROCESS HIVE & DEAD WEIGHT ===
  const { orbitData, deadWeightCount, deadPinIds } = useMemo(() => {
    const map: Record<string, PinRow[]> = {};
    let deadCount = 0;
    const deadIds: string[] = [];

    allPins.forEach(pin => {
      const assetKey = pin.asset_id || 'ORPHAN'; // Fallback key if we ever allow orphans here
      
      // 1. Grouping
      if (!map[assetKey]) {
        map[assetKey] = [];
      }
      map[assetKey].push(pin);

      // 2. Dead Weight Calculation
      const clicks = Number(pin.last_stats?.outbound_clicks || 0);
      if (clicks === 0) {
        deadCount++;
        deadIds.push(pin.id);
      }
    });

    return { orbitData: map, deadWeightCount: deadCount, deadPinIds: deadIds };
  }, [allPins]);

  // === ACTION: PURGE PROTOCOL ===
  const handlePurge = async () => {
    if (deadWeightCount === 0 || purging) return;
    
    setPurging(true);
    try {
      const { error } = await supabase
        .from('pins')
        .update({ asset_id: null })
        .in('id', deadPinIds);

      if (error) throw error;
      await fetchPins();
    } catch (err) {
      console.error('PURGE FAILED', err);
    } finally {
      setPurging(false);
    }
  };

  // === ACTION: SATELLITE INTERACTION ===
  const handleAssimilateClick = async (pinId: string, targetAssetId: string) => {
    // This is a placeholder for the logic requested.
    // In a real scenario, we might prompt for *which* asset to assign if it's currently NULL.
    // If it's already assigned (as implied by orbitData grouping), this might be a 'Re-assign' feature.
    // For the requirement "Si pin.asset_id es NULL", we execute the tactical action.
    await assimilateOrphan(pinId, targetAssetId);
    await fetchPins();
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-void-black space-y-4">
        <div className="w-12 h-12 border-4 border-t-amber-warning border-r-transparent border-b-amber-warning border-l-transparent rounded-full animate-spin"></div>
        <div className="text-amber-warning font-mono text-sm tracking-widest animate-pulse">
          SCANNING ORBITAL SECTOR...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-void-black p-8 space-y-12 custom-scrollbar font-mono">
      
      {/* INJECT ANIMATION STYLES */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .orbit-ring {
          animation: orbit 20s linear infinite;
        }
        /* Pause rotation on hover to allow clicking satellites */
        .orbit-container:hover .orbit-ring {
          animation-play-state: paused;
        }
      `}</style>

      {/* ==================================================================================
          SECCIÓN 1: DEAD WEIGHT PROTOCOL
      ================================================================================== */}
      <section className={`
        w-full border-2 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-500
        ${deadWeightCount > 0 
          ? 'border-alert-red bg-alert-red/5 shadow-[0_0_30px_rgba(239,68,68,0.1)]' 
          : 'border-matrix-green/30 bg-matrix-green/5'
        }
      `}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full border ${deadWeightCount > 0 ? 'border-alert-red text-alert-red bg-alert-red/10 animate-pulse' : 'border-matrix-green text-matrix-green'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-widest uppercase ${deadWeightCount > 0 ? 'text-alert-red' : 'text-matrix-green'}`}>
              {deadWeightCount > 0 ? 'DEAD WEIGHT DETECTED' : 'SYSTEM OPTIMIZED'}
            </h2>
            <p className={`text-xs mt-1 ${deadWeightCount > 0 ? 'text-alert-red/70' : 'text-matrix-green/60'}`}>
              NODES WITH ZERO TRAFFIC: <span className="font-bold text-lg">{deadWeightCount}</span>
            </p>
          </div>
        </div>

        <button 
          onClick={handlePurge}
          disabled={deadWeightCount === 0 || purging}
          className={`
            px-6 py-3 border font-bold uppercase tracking-widest text-sm transition-all
            ${deadWeightCount > 0 
              ? 'border-alert-red text-alert-red hover:bg-alert-red hover:text-black shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : 'border-matrix-green/30 text-matrix-green/30 cursor-not-allowed'
            }
          `}
        >
          {purging ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-t-transparent border-black rounded-full animate-spin"></span>
              PURGING...
            </span>
          ) : (
            '[ INITIATE PURGE ]'
          )}
        </button>
      </section>

      {/* ==================================================================================
          SECCIÓN 2: THE HIVE (ORBITAL VIEW)
      ================================================================================== */}
      <section>
        <div className="flex items-center gap-3 mb-8 border-b border-amber-warning/30 pb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-amber-warning tracking-widest uppercase">
            THE HIVE // ORBITAL VIEW
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 pb-12">
          {assets.map(asset => {
            const satellites = orbitData[asset.id] || [];
            const hasSatellites = satellites.length > 0;
            const rarityColor = RARITY_COLORS[asset.current_rarity || 'COMMON'] || '#fff';
            
            if (!hasSatellites) {
              return (
                <div key={asset.id} className="relative w-full aspect-square flex items-center justify-center border border-dashed border-gray-800 rounded-full opacity-40 hover:opacity-100 transition-opacity group">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-800 mb-2"></div>
                    <span className="text-[10px] uppercase">{asset.sku_slug}</span>
                    <span className="text-[8px] uppercase">GHOST PLANET</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={asset.id} className="orbit-container relative w-full aspect-square flex items-center justify-center">
                {/* ORBIT TRACK */}
                <div className="absolute w-[80%] h-[80%] border border-dashed border-gray-700 rounded-full"></div>

                {/* CENTRAL PLANET */}
                <div 
                  className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 border-black"
                  style={{ backgroundColor: rarityColor }}
                  title={`${asset.sku_slug} | ${asset.current_rarity}`}
                >
                  <span className="text-[8px] font-bold text-black text-center leading-tight px-1 break-all">
                    {asset.sku_slug.split('-').slice(1).join('-')}
                  </span>
                </div>

                {/* ROTATING ORBIT RING */}
                <div className="orbit-ring absolute w-[80%] h-[80%] rounded-full">
                  {satellites.map((pin, i) => {
                    const total = satellites.length;
                    const angle = (360 / total) * i;
                    const isDead = Number(pin.last_stats?.outbound_clicks || 0) === 0;

                    return (
                      <div
                        key={pin.id}
                        className="group/satellite absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full cursor-pointer transition-transform hover:scale-150"
                        style={{
                          transform: `rotate(${angle}deg) translate(500%) rotate(-${angle}deg)`, 
                          backgroundColor: isDead ? '#ef4444' : '#00ff41',
                          boxShadow: isDead ? '0 0 5px #ef4444' : '0 0 5px #00ff41',
                          zIndex: 20
                        }}
                      >
                         {/* TOOLTIP ON HOVER (Pauses rotation via CSS) */}
                         <div className="hidden group-hover/satellite:block absolute bottom-4 left-1/2 -translate-x-1/2 w-32 bg-black border border-gray-600 p-2 z-50 text-[10px] pointer-events-none">
                            <div className="text-white font-bold mb-1">PIN ID: {pin.id.substring(0,4)}...</div>
                            <div className="text-gray-400">Clicks: {pin.last_stats?.outbound_clicks || 0}</div>
                            
                            {/* LOGIC: Show Assimilate Button if Orphan (asset_id is NULL) */}
                            {!pin.asset_id && (
                                <div className="mt-2 pt-2 border-t border-gray-700 pointer-events-auto">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssimilateClick(pin.id, asset.id);
                                        }}
                                        className="w-full bg-matrix-green text-black font-bold uppercase py-1 hover:bg-white"
                                    >
                                        [ ASSIMILATE ]
                                    </button>
                                </div>
                            )}
                         </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* INFO FOOTER */}
                <div className="absolute bottom-4 text-center">
                  <div className="text-xs text-amber-warning font-bold">{satellites.length} SATELLITES</div>
                  <div className="text-[10px] text-gray-500">TRAFFIC: {asset.cached_traffic_score}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}