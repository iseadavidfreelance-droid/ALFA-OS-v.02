import React, { useMemo } from 'react';
import { Database } from './database.types';
import MonolithCard from './MonolithCard';

type AssetRow = Database['public']['Tables']['assets']['Row'];
type RarityTier = Database['public']['Enums']['rarity_tier'];

interface ArenaProps {
  assets: AssetRow[];
}

// Mapa de valor para comparaciones de jerarquía
const RARITY_MAP: Record<RarityTier, number> = { 
  COMMON: 0, 
  UNCOMMON: 1, 
  RARE: 2, 
  EPIC: 3, 
  LEGENDARY: 4 
};

export default function Arena({ assets }: ArenaProps) {

  // === LÓGICA DE FILTRADO Y SEGMENTACIÓN ===
  const { immortals, fallen, risingStars } = useMemo(() => {
    
    // 1. IMMORTALS: La élite (Legendary o Epic)
    const immortalsList = assets
      .filter(a => {
        const r = a.current_rarity || 'COMMON';
        return r === 'LEGENDARY' || r === 'EPIC';
      })
      .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

    // 2. THE FALLEN: Activos cuyo rango actual es menor a su máximo histórico (Ghost Protocol)
    const fallenList = assets.filter(a => {
      const current = RARITY_MAP[a.current_rarity || 'COMMON'];
      const highest = RARITY_MAP[a.highest_rarity_achieved || 'COMMON'];
      return highest > current;
    });

    // 3. RISING STARS: Incubación con alto tráfico pero sin ventas aún
    const risingList = assets.filter(a => {
      const isIncubation = a.lifecycle_state === 'INCUBATION';
      const traffic = a.cached_traffic_score || 0;
      const revenue = a.cached_revenue_score || 0;
      return isIncubation && traffic > 500 && revenue === 0;
    });

    return { immortals: immortalsList, fallen: fallenList, risingStars: risingList };
  }, [assets]);

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-12 bg-void-black scrollbar-thin scrollbar-thumb-matrix-green/20 scrollbar-track-transparent">
      
      {/* ==================================================================================
          SECCIÓN 1: HALL OF IMMORTALS
      ================================================================================== */}
      <section>
        <div className="mb-6 flex items-center gap-4 border-b border-amber-500/30 pb-2">
          <div className="w-2 h-8 bg-amber-500 shadow-[0_0_15px_#f59e0b] animate-pulse"></div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-amber-500 tracking-[0.2em] uppercase">
              Hall of Immortals
            </h2>
            <p className="text-[10px] font-mono text-amber-500/60 uppercase">
              High-Value Assets // Apex Predator Class
            </p>
          </div>
        </div>

        {immortals.length === 0 ? (
          <div className="w-full h-48 border-2 border-dashed border-amber-900/50 bg-amber-900/5 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl opacity-20">👑</span>
            <span className="text-amber-700 font-mono tracking-widest text-sm">
              VACUUM DETECTED. BECOME THE FIRST.
            </span>
          </div>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-8 snap-x mandatory items-start">
            {immortals.map((asset, index) => (
              <div key={asset.id} className="snap-center shrink-0">
                <MonolithCard asset={asset} rankIndex={index + 1} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==================================================================================
          SECCIÓN 2: THE FALLEN (PROTOCOL GHOST)
      ================================================================================== */}
      {fallen.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between border-b border-alert-red/30 pb-2">
            <h2 className="text-lg font-bold font-mono text-alert-red flex items-center gap-2">
              <span className="animate-pulse">⚠️</span> THE FALLEN // GHOST PROTOCOL
            </h2>
            <span className="text-xs font-mono text-alert-red/60">{fallen.length} UNITS DETECTED</span>
          </div>

          <div className="grid gap-3">
            {fallen.map((asset) => (
              <div 
                key={asset.id} 
                className="bg-alert-red/5 border border-alert-red/20 p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-alert-red/10 transition-colors"
              >
                {/* Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-1 h-10 bg-alert-red/50"></div>
                  <div className="min-w-0">
                    <div className="text-white font-bold font-mono truncate">{asset.sku_slug}</div>
                    <div className="text-[10px] font-mono text-alert-red/70 flex gap-4 mt-1">
                      <span>CURRENT: {asset.current_rarity}</span>
                      <span className="text-alert-red font-bold">HISTORICAL: {asset.highest_rarity_achieved}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="font-mono text-xs text-right hidden md:block">
                   <div className="text-white/50">TRAFFIC LOSS</div>
                   <div className="text-alert-red font-bold">CRITICAL</div>
                </div>

                {/* Action */}
                <button className="px-4 py-2 border border-alert-red text-alert-red text-xs font-bold hover:bg-alert-red hover:text-black uppercase tracking-wider transition-all">
                  [ RE-IGNITE ]
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================================
          SECCIÓN 3: RISING STARS (RADAR)
      ================================================================================== */}
      {risingStars.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 border-b border-blue-500/30 pb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-lg font-bold font-mono text-blue-400 tracking-wider">
              RISING STARS // HIGH MOMENTUM
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {risingStars.map((asset) => (
              <div key={asset.id} className="bg-blue-900/10 border border-blue-500/30 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-50">
                  <span className="text-[10px] text-blue-300 font-mono border border-blue-300/30 px-1 rounded">INCUBATION</span>
                </div>
                
                <h3 className="text-white font-bold font-mono text-sm mb-2 truncate pr-16">{asset.sku_slug}</h3>
                
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[9px] text-blue-400/60 uppercase">Traffic Accumulation</div>
                    <div className="text-xl font-mono text-blue-400 font-bold">
                      {asset.cached_traffic_score?.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-blue-500/50 flex items-center justify-center animate-pulse">
                    <div className="w-4 h-4 bg-blue-500 rounded-full blur-[4px]"></div>
                  </div>
                </div>

                {/* Progress Decorator */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 group-hover:w-full w-1/3 transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}