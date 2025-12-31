import React, { useMemo } from 'react';
import { Database } from './database.types';
import MonolithCard from './MonolithCard';

type AssetRow = Database['public']['Tables']['assets']['Row'];
type RarityTier = Database['public']['Enums']['rarity_tier'];

interface ArenaProps {
  assets: AssetRow[];
}

const RARITY_POWER: Record<RarityTier, number> = { 
  COMMON: 0, 
  UNCOMMON: 1, 
  RARE: 2, 
  EPIC: 3, 
  LEGENDARY: 4 
};

export default function Arena({ assets }: ArenaProps) {

  const { immortals, fallen, risingStars } = useMemo(() => {
    
    // 1. IMMORTALS: Legendary o Epic, ordenados por total_score DESC
    const immortalsList = assets
      .filter(a => {
        const r = a.current_rarity || 'COMMON';
        return r === 'LEGENDARY' || r === 'EPIC';
      })
      .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

    // 2. THE FALLEN: Rango histórico mayor al actual
    const fallenList = assets.filter(a => {
      const current = RARITY_POWER[a.current_rarity || 'COMMON'];
      const highest = RARITY_POWER[a.highest_rarity_achieved || 'COMMON'];
      return highest > current;
    });

    // 3. RISING STARS: Incubation, Tráfico > 100, Sin Ventas
    const risingList = assets.filter(a => {
      const isIncubation = a.lifecycle_state === 'INCUBATION';
      const traffic = a.cached_traffic_score || 0;
      const revenue = a.cached_revenue_score || 0;
      return isIncubation && traffic > 100 && revenue === 0;
    });

    return { immortals: immortalsList, fallen: fallenList, risingStars: risingList };
  }, [assets]);

  return (
    <div className="w-full h-full overflow-y-auto bg-void-black p-8 space-y-16 custom-scrollbar">
      
      {/* ==================================================================================
          SECCIÓN 1: HALL OF IMMORTALS
      ================================================================================== */}
      <section>
        <h2 className="text-2xl font-bold text-amber-400 tracking-[0.5em] mb-8 border-b border-amber-400/30 pb-2 uppercase font-mono">
          Hall of Immortals
        </h2>

        {immortals.length > 0 ? (
          <div className="flex flex-wrap gap-8 justify-center">
            {immortals.map((asset, index) => (
              <MonolithCard key={asset.id} asset={asset} rankIndex={index + 1} />
            ))}
          </div>
        ) : (
          <div className="w-full py-20 border-2 border-dashed border-amber-400/20 bg-amber-400/5 flex items-center justify-center">
            <span className="text-amber-400/50 font-mono text-xl tracking-widest animate-pulse">
              THRONE EMPTY. SEIZE GLORY.
            </span>
          </div>
        )}
      </section>

      {/* ==================================================================================
          SECCIÓN 2: THE FALLEN (PROTOCOL GHOST)
      ================================================================================== */}
      {fallen.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-alert-red mb-4 flex items-center gap-2 font-mono uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Protocol Ghost // The Fallen
          </h2>

          <div className="w-full border border-alert-red/20 overflow-hidden">
            <table className="w-full text-left font-mono">
              <thead className="bg-alert-red/10 text-alert-red text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">SKU Identifier</th>
                  <th className="p-4">Historical Rank</th>
                  <th className="p-4">Current Rank</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-alert-red/10 text-sm text-gray-300">
                {fallen.map(asset => (
                  <tr key={asset.id} className="hover:bg-alert-red/5 transition-colors">
                    <td className="p-4 font-bold">{asset.sku_slug}</td>
                    <td className="p-4 text-amber-500/80">{asset.highest_rarity_achieved}</td>
                    <td className="p-4 text-gray-500">{asset.current_rarity}</td>
                    <td className="p-4 text-right">
                      <button className="px-3 py-1 text-xs border border-alert-red text-alert-red hover:bg-alert-red hover:text-black transition-all font-bold uppercase tracking-wider">
                        [ RE-IGNITE ]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================================================================================
          SECCIÓN 3: RISING STARS (RADAR)
      ================================================================================== */}
      {risingStars.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-matrix-green mb-4 font-mono uppercase tracking-widest border-l-4 border-matrix-green pl-4">
            Radar // Rising Stars
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {risingStars.map(asset => (
              <div key={asset.id} className="bg-matrix-green/5 border border-matrix-green/20 p-4 flex flex-col justify-between hover:border-matrix-green/50 transition-all group cursor-default">
                <div className="text-xs text-matrix-green/50 mb-2 uppercase tracking-tight">Incubation Unit</div>
                <div className="font-mono font-bold text-white group-hover:text-matrix-green transition-colors truncate">
                  {asset.sku_slug}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-[10px] text-gray-500">TRAFFIC</span>
                  <span className="text-lg font-mono font-bold text-matrix-green">
                    {asset.cached_traffic_score?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}