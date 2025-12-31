import React from 'react';

interface TelemetryProps {
  totalRevenue: number;
  totalTraffic: number;
  assetsCount: number;
  alertMode?: boolean;
}

export default function Telemetry({ totalRevenue, totalTraffic, assetsCount, alertMode = false }: TelemetryProps) {
  return (
    <div className={`h-full w-full flex items-center justify-between px-6 border-b select-none transition-all duration-300 ${
      alertMode 
        ? 'bg-amber-900/20 border-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]' 
        : 'bg-void-black border-matrix-green/30'
    }`}>
      
      {/* SECTOR 1: IDENTITY */}
      <div className="flex items-center gap-4">
        <div className={`w-2 h-8 animate-pulse shadow-[0_0_10px_currentColor] ${alertMode ? 'bg-amber-500 text-amber-500' : 'bg-matrix-green text-[#00ff41]'}`}></div>
        <h1 className="text-xl font-bold tracking-[0.2em] text-white font-mono">
          ALFA OS <span className={`${alertMode ? 'text-amber-500' : 'text-matrix-green'} text-sm`}>// OMNISCIENT</span>
        </h1>
      </div>

      {/* SECTOR 2: SYSTEM STATUS */}
      <div className={`hidden md:flex items-center gap-6 text-xs font-mono tracking-wider ${alertMode ? 'text-amber-500/80' : 'text-matrix-green/50'}`}>
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${alertMode ? 'bg-amber-500 animate-ping' : 'bg-matrix-green'}`}></span>
          NET: ONLINE
        </span>
        <span>LATENCY: 12ms</span>
        <span>UPTIME: 99.9%</span>
        <span>UNITS: {assetsCount.toString().padStart(3, '0')}</span>
      </div>

      {/* SECTOR 3: GLOBAL METRICS */}
      <div className={`flex items-center gap-6 font-mono text-sm font-bold px-4 py-1 rounded border transition-colors duration-300 ${
        alertMode 
          ? 'bg-amber-500/10 border-amber-500' 
          : 'bg-matrix-green/5 border-matrix-green/10'
      }`}>
        <div className="flex flex-col items-end leading-none">
          <span className={`text-[10px] uppercase ${alertMode ? 'text-amber-200' : 'text-amber-warning/70'}`}>Revenue Yield</span>
          <span className={`tracking-wide ${alertMode ? 'text-white' : 'text-amber-warning'}`}>
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className={`h-8 w-px ${alertMode ? 'bg-amber-500/40' : 'bg-matrix-green/20'}`}></div>

        <div className="flex flex-col items-start leading-none">
          <span className={`text-[10px] uppercase ${alertMode ? 'text-amber-200' : 'text-matrix-green/70'}`}>Traffic Mass</span>
          <span className={`tracking-wide ${alertMode ? 'text-white' : 'text-matrix-green'}`}>
            {totalTraffic.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}