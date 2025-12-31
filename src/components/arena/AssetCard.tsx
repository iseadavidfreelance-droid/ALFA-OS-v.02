import React, { useState } from 'react';
import { Database } from '../../../database.types';
import { useTacticalActions } from '../../hooks/useTacticalActions';

type AssetRow = Database['public']['Tables']['assets']['Row'];

// Extendemos la interfaz para incluir los campos de la vista de inteligencia (v_asset_health_check)
// que se mencionan en el contexto, aunque no estén en el tipo base de la tabla.
interface AssetWithHealth extends AssetRow {
  link_status?: 'CRITICAL' | 'WARNING' | 'OK';
  pin_count?: number;
  last_sale_at?: string | null;
  days_since_sale?: number;
}

interface AssetCardProps {
  asset: AssetWithHealth;
  onEdit: (asset: AssetWithHealth) => void;
  onManualSale: (asset: AssetWithHealth) => void;
}

export default function AssetCard({ asset, onEdit, onManualSale }: AssetCardProps) {
  const { reigniteAsset } = useTacticalActions();
  const [isIgniting, setIsIgniting] = useState(false);

  // === VISUAL LOGIC ===
  const getBorderState = () => {
    // Priority 1: Critical Link (Broken Asset)
    if (asset.link_status === 'CRITICAL') {
      return 'border-amber-warning shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse bg-amber-900/10';
    }
    // Priority 2: Zero Pins (Orphan/Dead Weight)
    if ((asset.pin_count || 0) === 0) {
      return 'border-alert-red shadow-[0_0_10px_rgba(239,68,68,0.15)] bg-alert-red/5';
    }
    // Priority 3: Warning Link
    if (asset.link_status === 'WARNING') {
      return 'border-amber-warning/50 bg-void-black';
    }
    // Default
    return 'border-slate-800 bg-void-black hover:border-matrix-green/30 transition-colors';
  };

  // === HANDLERS ===
  const handleReignite = async () => {
    if (isIgniting) return;
    setIsIgniting(true);
    await reigniteAsset(asset.id);
    // El estado de carga se mantiene un poco visualmente o se resetea
    setTimeout(() => setIsIgniting(false), 2000);
  };

  const borderClass = getBorderState();
  const totalScore = (asset.cached_traffic_score || 0) + (asset.cached_revenue_score || 0);

  return (
    <div className={`relative rounded-lg border-2 p-4 flex flex-col justify-between gap-4 h-full ${borderClass}`}>
      
      {/* HEADER: Identity & Health */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">UNIT ID</span>
          <span className="text-white font-bold font-mono text-sm tracking-wide truncate max-w-[150px]" title={asset.sku_slug}>
            {asset.sku_slug}
          </span>
        </div>
        
        {/* Status Indicator Badge */}
        <div className="flex flex-col items-end gap-1">
            {asset.link_status === 'CRITICAL' && (
                <span className="text-[9px] bg-amber-warning text-black px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                    LINK BROKEN
                </span>
            )}
            {(asset.pin_count || 0) === 0 && (
                <span className="text-[9px] bg-alert-red text-black px-1.5 py-0.5 rounded font-bold uppercase">
                    NO SIGNAL
                </span>
            )}
            {asset.link_status === 'OK' && (asset.pin_count || 0) > 0 && (
                <span className="text-[9px] text-matrix-green border border-matrix-green/30 px-1.5 py-0.5 rounded uppercase">
                    ONLINE
                </span>
            )}
        </div>
      </div>

      {/* BODY: Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        
        {/* Metric: Traffic / Pins */}
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
                {/* Icon: Signal */}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                <span>TRAFFIC</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-white font-bold">{asset.cached_traffic_score || 0}</span>
                <span className="text-[9px] text-slate-500">{asset.pin_count || 0} PINS</span>
            </div>
        </div>

        {/* Metric: Sales / Recency */}
        <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
                {/* Icon: Dollar */}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>REVENUE</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-amber-warning font-bold">${asset.cached_revenue_score || 0}</span>
                <span className={`text-[9px] ${(asset.days_since_sale || 999) > 30 ? 'text-alert-red' : 'text-matrix-green'}`}>
                    {(asset.days_since_sale !== undefined) ? `${asset.days_since_sale}d AGO` : '--'}
                </span>
            </div>
        </div>
      </div>

      {/* FOOTER: Action Bar */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        
        {/* 1. EDIT (Gray) */}
        <button 
            onClick={() => onEdit(asset)}
            className="col-span-1 border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white text-[10px] font-bold py-1 rounded transition-colors uppercase"
            title="Edit Manifest"
        >
            EDIT
        </button>

        {/* 2. RE-IGNITE (Action/RPC) */}
        <button 
            onClick={handleReignite}
            disabled={isIgniting}
            className={`col-span-2 border text-[10px] font-bold py-1 rounded transition-all uppercase flex items-center justify-center gap-1
                ${isIgniting 
                    ? 'border-alert-red text-alert-red cursor-wait' 
                    : 'border-slate-500 text-slate-300 hover:border-alert-red hover:text-alert-red hover:bg-alert-red/10'
                }
            `}
            title="Trigger Sync & Refresh Score"
        >
            {isIgniting ? (
                <span className="animate-spin h-3 w-3 border-2 border-t-transparent border-current rounded-full"></span>
            ) : (
                <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    RE-IGNITE
                </>
            )}
        </button>

        {/* 3. +$ (Manual Sale) */}
        <button 
            onClick={() => onManualSale(asset)}
            className="col-span-1 bg-matrix-green/10 border border-matrix-green/50 text-matrix-green hover:bg-matrix-green hover:text-black text-[10px] font-bold py-1 rounded transition-colors uppercase"
            title="Log Manual Transaction"
        >
            +$
        </button>

      </div>
    </div>
  );
}