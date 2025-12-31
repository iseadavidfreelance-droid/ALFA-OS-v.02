import React from 'react';
import { Database } from './database.types';

type AssetRow = Database['public']['Tables']['assets']['Row'];
type RarityTier = Database['public']['Enums']['rarity_tier'];

interface MainframeProps {
  assets: AssetRow[];
}

// Configuración visual de Rarezas
const RARITY_CONFIG: Record<RarityTier, { color: string; border: string; bg: string }> = {
  COMMON: { color: 'text-slate-400', border: 'border-slate-600', bg: 'bg-slate-800' },
  UNCOMMON: { color: 'text-emerald-400', border: 'border-emerald-600', bg: 'bg-emerald-900/30' },
  RARE: { color: 'text-blue-400', border: 'border-blue-600', bg: 'bg-blue-900/30' },
  EPIC: { color: 'text-purple-400', border: 'border-purple-600', bg: 'bg-purple-900/30' },
  LEGENDARY: { color: 'text-amber-warning', border: 'border-amber-warning', bg: 'bg-amber-900/30' },
};

const RARITY_ORDER: RarityTier[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export default function Mainframe({ assets }: MainframeProps) {
  return (
    <div className="w-full h-full bg-void-black flex flex-col overflow-hidden font-mono">
      
      {/* HEADER ROW */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-matrix-green/20 bg-matrix-green/5 text-xs font-bold text-matrix-green tracking-wider uppercase sticky top-0 z-10">
        <div className="col-span-3">IDENTIFIER (SKU)</div>
        <div className="col-span-2">RANK CLASS</div>
        <div className="col-span-5">PERFORMANCE METRICS</div>
        <div className="col-span-2 text-right">CYCLE STATUS</div>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-matrix-green/20 scrollbar-track-transparent">
        {assets.length === 0 ? (
           <div className="h-full flex items-center justify-center text-matrix-green/30 text-sm">
             >> NO ASSETS INDEXED IN LOCAL DATABASE
           </div>
        ) : (
          assets.map((asset) => {
            // Logic: Ratchet Check
            const current = asset.current_rarity || 'COMMON';
            const highest = asset.highest_rarity_achieved || 'COMMON';
            const isGhost = RARITY_ORDER.indexOf(highest) > RARITY_ORDER.indexOf(current);
            const rarityStyle = RARITY_CONFIG[current];

            // Logic: Dual Bar Metrics
            const traffic = asset.cached_traffic_score || 0;
            const revenue = asset.cached_revenue_score || 0;
            const total = traffic + revenue;
            const trafficPct = total > 0 ? (traffic / total) * 100 : 0;
            const revenuePct = total > 0 ? (revenue / total) * 100 : 0;

            return (
              <div 
                key={asset.id} 
                className="grid grid-cols-12 gap-4 items-center px-4 h-12 border-b border-matrix-green/10 hover:bg-matrix-green/5 transition-colors group"
              >
                {/* SKU */}
                <div className="col-span-3 text-white text-sm truncate font-bold group-hover:text-matrix-green transition-colors">
                  {asset.sku_slug}
                </div>

                {/* RANK + GHOST */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${rarityStyle.border} ${rarityStyle.bg} ${rarityStyle.color} font-bold`}>
                    {current}
                  </span>
                  
                  {isGhost && (
                    <div className="relative group/ghost">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-4 h-4 text-slate-500 animate-pulse"
                      >
                        <path d="M12 2C7.58 2 4 5.58 4 10v10l4-2 4 2 4-2 4 2V10c0-4.42-3.58-8-8-8zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                      </svg>
                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 top-0 bg-void-black border border-slate-600 text-[10px] text-slate-300 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/ghost:opacity-100 pointer-events-none z-20">
                        Historical: {highest}
                      </div>
                    </div>
                  )}
                </div>

                {/* COMPACT DUAL BAR */}
                <div className="col-span-5 flex flex-col justify-center gap-1">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex relative">
                     {total === 0 && <div className="w-full bg-slate-800"></div>}
                     <div style={{ width: `${trafficPct}%` }} className="h-full bg-matrix-green opacity-80"></div>
                     <div style={{ width: `${revenuePct}%` }} className="h-full bg-amber-warning opacity-80"></div>
                  </div>
                  <div className="flex justify-between text-[10px] leading-none opacity-60 font-mono">
                    <span className="text-matrix-green">{traffic.toFixed(0)}</span>
                    <span className="text-amber-warning">${revenue.toFixed(2)}</span>
                  </div>
                </div>

                {/* STATUS */}
                <div className="col-span-2 text-right">
                  <span className={`text-[10px] tracking-wider ${
                    asset.lifecycle_state === 'MONETIZATION' ? 'text-amber-warning' : 'text-slate-500'
                  }`}>
                    {asset.lifecycle_state}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}