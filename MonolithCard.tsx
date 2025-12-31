import React, { useMemo } from 'react';
import { Database } from './database.types';

type AssetRow = Database['public']['Tables']['assets']['Row'];

interface MonolithCardProps {
  asset: AssetRow;
  rankIndex: number;
}

// Configuración de temas visuales
const THEMES = {
  LEGENDARY: {
    border: 'border-amber-400',
    text: 'text-amber-400',
    shadow: 'shadow-[0_0_30px_rgba(251,191,36,0.2)]',
    glow: 'from-amber-500/20',
    bar: 'bg-amber-400'
  },
  EPIC: {
    border: 'border-hyper-violet',
    text: 'text-hyper-violet',
    shadow: 'shadow-[0_0_30px_rgba(147,51,234,0.2)]',
    glow: 'from-purple-600/20',
    bar: 'bg-hyper-violet'
  },
  DEFAULT: {
    border: 'border-slate-600',
    text: 'text-slate-400',
    shadow: 'shadow-none',
    glow: 'from-slate-700/20',
    bar: 'bg-slate-600'
  }
};

export default function MonolithCard({ asset, rankIndex }: MonolithCardProps) {
  const rarity = asset.current_rarity || 'COMMON';
  // Fallback seguro a EPIC si es raro, o DEFAULT si es común (aunque Monolith se usa para rangos altos)
  const theme = (rarity === 'LEGENDARY' || rarity === 'EPIC') ? THEMES[rarity] : THEMES.DEFAULT;

  // Cálculo de Métricas
  const totalScore = (asset.cached_traffic_score || 0) + (asset.cached_revenue_score || 0);

  const daysReign = useMemo(() => {
    const created = new Date(asset.created_at);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [asset.created_at]);

  return (
    <div className={`
      relative w-64 h-96 flex flex-col justify-between overflow-hidden 
      bg-void-black border-2 transition-all duration-500 group
      hover:scale-105 hover:z-20
      ${theme.border} ${theme.shadow}
    `}>
      
      {/* BACKGROUND RANK NUMBER (Watermark) */}
      <div className="absolute -top-8 -right-4 text-[10rem] font-black text-white/5 select-none z-0 leading-none pointer-events-none">
        {rankIndex}
      </div>

      {/* HOVER GLOW GRADIENT */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0`} />

      {/* === CONTENT LAYER (Z-10) === */}
      
      {/* HEADER: REIGN TIME */}
      <div className="relative z-10 p-6 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme.bar}`}></div>
          <span className={`text-[10px] font-mono tracking-widest uppercase opacity-70 ${theme.text}`}>
            Reign Duration
          </span>
        </div>
        <div className="text-white font-mono text-sm tracking-wider font-bold">
          {daysReign} DAYS
        </div>
      </div>

      {/* BODY: VERTICAL IDENTITY */}
      <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
        {/* CSS writing-mode vertical-rl para texto vertical tipo lomo de libro/ciberpunk */}
        <div className="writing-vertical-rl rotate-180 text-2xl font-black font-mono tracking-[0.15em] text-white/90 uppercase truncate max-h-[220px] drop-shadow-lg">
          {asset.sku_slug}
        </div>
      </div>

      {/* FOOTER: METRICS */}
      <div className="relative z-10 p-6 pt-0 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex flex-col gap-2">
          
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Mass Score</span>
            <span className={`text-xs font-bold px-2 py-0.5 border ${theme.border} ${theme.text} bg-black/50 rounded`}>
              {rarity}
            </span>
          </div>

          <div className="text-4xl font-mono font-bold text-white tracking-tighter">
            {totalScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>

          {/* Decorative Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex mt-2">
            <div className={`h-full w-2/3 ${theme.bar} shadow-[0_0_10px_currentColor]`}></div>
            <div className="h-full w-1/3 bg-slate-700/30"></div>
          </div>
        </div>
      </div>

    </div>
  );
}