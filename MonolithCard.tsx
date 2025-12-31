import React from 'react';
import { Database } from './database.types';

type AssetRow = Database['public']['Tables']['assets']['Row'];
type RarityTier = Database['public']['Enums']['rarity_tier'];

interface MonolithCardProps {
  asset: AssetRow;
  rankIndex: number;
}

// Configuración de Estilos por Rareza (Solo definimos EPIC y LEGENDARY, fallback para otros)
const MONOLITH_STYLES: Record<string, { border: string; text: string; shadow: string; gradient: string; glow: string }> = {
  LEGENDARY: {
    border: 'border-amber-400',
    text: 'text-amber-400',
    shadow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    gradient: 'from-amber-900/60 via-amber-900/10 to-transparent',
    glow: 'bg-amber-400'
  },
  EPIC: {
    border: 'border-hyper-violet',
    text: 'text-hyper-violet',
    shadow: 'shadow-[0_0_30px_rgba(147,51,234,0.3)]',
    gradient: 'from-purple-900/60 via-purple-900/10 to-transparent',
    glow: 'bg-hyper-violet'
  },
  // Fallback seguro
  DEFAULT: {
    border: 'border-slate-600',
    text: 'text-slate-400',
    shadow: 'shadow-none',
    gradient: 'from-slate-900/50 via-transparent to-transparent',
    glow: 'bg-slate-600'
  }
};

export default function MonolithCard({ asset, rankIndex }: MonolithCardProps) {
  const rarity = asset.current_rarity || 'COMMON';
  const style = MONOLITH_STYLES[rarity] || MONOLITH_STYLES.DEFAULT;

  // Cálculos de Métricas
  const totalScore = (asset.cached_traffic_score || 0) + (asset.cached_revenue_score || 0);
  
  const daysActive = React.useMemo(() => {
    const created = new Date(asset.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  }, [asset.created_at]);

  return (
    <div className={`relative w-48 aspect-[9/16] flex flex-col justify-between overflow-hidden border-2 bg-black transition-transform duration-300 hover:scale-[1.02] ${style.border} ${style.shadow}`}>
      
      {/* BACKGROUND GRADIENT */}
      <div className={`absolute inset-0 bg-gradient-to-t ${style.gradient} pointer-events-none`} />
      
      {/* TOP: RANKING */}
      <div className="relative z-10 p-4 flex justify-between items-start">
        <div className="flex flex-col">
          <span className={`text-[10px] font-mono opacity-60 ${style.text}`}>RANK</span>
          <span className={`text-4xl font-bold font-mono tracking-tighter ${style.text} drop-shadow-md`}>
            #{rankIndex}
          </span>
        </div>
        {/* Decorative Light */}
        <div className={`w-2 h-2 rounded-full ${style.glow} animate-pulse shadow-[0_0_10px_currentColor]`} />
      </div>

      {/* CENTER: VERTICAL IDENTITY */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-4">
        <div className={`writing-vertical-rl rotate-180 text-lg font-bold font-mono tracking-[0.2em] uppercase truncate max-h-[200px] text-white/90`}>
          {asset.sku_slug}
        </div>
      </div>

      {/* BOTTOM: METRICS */}
      <div className="relative z-10 p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="flex flex-col gap-3">
          
          {/* TOTAL SCORE */}
          <div>
            <div className={`text-[9px] font-mono uppercase tracking-wider mb-0.5 text-white/50`}>
              Mass Score
            </div>
            <div className={`text-xl font-bold font-mono text-white`}>
              {totalScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* REIGN DURATION */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
               <span className="text-[9px] font-mono text-white/50 uppercase">Active Reign</span>
               <span className={`text-sm font-bold font-mono ${style.text}`}>
                 {daysActive} DAYS
               </span>
            </div>
            {/* Rarity Badge */}
            <span className={`text-[8px] px-1.5 py-0.5 border ${style.border} ${style.text} rounded opacity-80 uppercase`}>
              {rarity}
            </span>
          </div>

        </div>
      </div>

      {/* DECORATIVE CORNERS */}
      <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 ${style.border} opacity-50`} />
      <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 ${style.border} opacity-50`} />

    </div>
  );
}