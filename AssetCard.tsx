import React from 'react';
import { Database } from './database.types';

type AssetRow = Database['public']['Tables']['assets']['Row'];
type RarityTier = Database['public']['Enums']['rarity_tier'];

interface AssetCardProps {
  asset: AssetRow;
}

const RARITY_ORDER: RarityTier[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

const RARITY_STYLES: Record<RarityTier, { border: string; text: string; shadow: string; bg: string }> = {
  COMMON: { 
    border: 'border-slate-600', 
    text: 'text-slate-400', 
    shadow: 'shadow-slate-900/50',
    bg: 'bg-slate-800'
  },
  UNCOMMON: { 
    border: 'border-emerald-500', 
    text: 'text-emerald-400', 
    shadow: 'shadow-emerald-900/50',
    bg: 'bg-slate-800' 
  },
  RARE: { 
    border: 'border-blue-500', 
    text: 'text-blue-400', 
    shadow: 'shadow-blue-900/50', 
    bg: 'bg-slate-800'
  },
  EPIC: { 
    border: 'border-purple-500', 
    text: 'text-purple-400', 
    shadow: 'shadow-purple-900/50',
    bg: 'bg-slate-800' 
  },
  LEGENDARY: { 
    border: 'border-amber-400', 
    text: 'text-amber-400', 
    shadow: 'shadow-amber-900/50',
    bg: 'bg-slate-800' 
  },
};

export default function AssetCard({ asset }: AssetCardProps) {
  const currentRarity = asset.current_rarity || 'COMMON';
  const highestRarity = asset.highest_rarity_achieved || 'COMMON';
  
  const styles = RARITY_STYLES[currentRarity];

  // Logic: Ratchet (Trinquete) check
  const currentIndex = RARITY_ORDER.indexOf(currentRarity);
  const highestIndex = RARITY_ORDER.indexOf(highestRarity);
  const isRatchetActive = highestIndex > currentIndex;

  // Logic: Dual Progress Bar Calculation
  const traffic = asset.cached_traffic_score || 0;
  const revenue = asset.cached_revenue_score || 0;
  const total = traffic + revenue;
  
  // Prevent division by zero
  const trafficPct = total > 0 ? (traffic / total) * 100 : 0;
  const revenuePct = total > 0 ? (revenue / total) * 100 : 0;

  return (
    <div className={`relative rounded-lg border-2 p-5 transition-all hover:-translate-y-1 hover:shadow-xl ${styles.border} ${styles.bg} ${styles.shadow} shadow-lg`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-mono text-sm text-slate-500 mb-1">UNIT ID</h3>
          <div className="font-bold text-lg tracking-wider text-white break-all">
            {asset.sku_slug}
          </div>
        </div>
        
        {/* RATCHET GHOST INDICATOR */}
        {isRatchetActive && (
          <div className="group relative">
             <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-8 h-8 text-slate-600 opacity-80 animate-pulse"
            >
              <path d="M12 2C7.58 2 4 5.58 4 10v10l4-2 4 2 4-2 4 2V10c0-4.42-3.58-8-8-8zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              <circle cx="9" cy="9" r="1.5" className="text-slate-900 fill-current"/>
              <circle cx="15" cy="9" r="1.5" className="text-slate-900 fill-current"/>
            </svg>
            
            {/* Tooltip */}
            <div className="absolute right-0 -top-8 w-48 bg-black text-xs text-slate-300 p-2 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Ghost Protocol Active.
              <br/>
              Historical Rank: <span className="text-amber-400">{highestRarity}</span>
            </div>
          </div>
        )}
      </div>

      {/* METRICS & DUAL BAR */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono uppercase">
          <span className="text-emerald-400 flex items-center gap-1">
            Traffic Mass
          </span>
          <span className="text-amber-400 flex items-center gap-1">
            Revenue Yield
          </span>
        </div>

        {/* THE DUAL BAR */}
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-700 relative">
          {total === 0 && <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[8px] text-slate-600">NO DATA</div>}
          
          <div 
            style={{ width: `${trafficPct}%` }} 
            className="h-full bg-gradient-to-r from-emerald-900 to-emerald-500"
          />
          <div 
            style={{ width: `${revenuePct}%` }} 
            className="h-full bg-gradient-to-l from-amber-600 to-amber-400"
          />
        </div>

        {/* NUMERICAL VALUES */}
        <div className="flex justify-between text-xs font-bold font-mono">
          <span className="text-emerald-500">{traffic.toFixed(2)}</span>
          <span className="text-slate-500">SCORE: {total.toFixed(2)}</span>
          <span className="text-amber-500">${revenue.toFixed(2)}</span>
        </div>
      </div>

      {/* FOOTER BADGE */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
        <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-900 border ${styles.border} ${styles.text}`}>
          {currentRarity}
        </span>
        <span className="text-[10px] text-slate-500 uppercase">
           {asset.lifecycle_state}
        </span>
      </div>
    </div>
  );
}