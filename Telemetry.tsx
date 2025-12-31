import React from 'react';

interface TelemetryProps {
  totalRevenue: number;
  totalTraffic: number;
  assetsCount: number;
}

export default function Telemetry({ totalRevenue, totalTraffic, assetsCount }: TelemetryProps) {
  return (
    <div className="h-full w-full flex items-center justify-between px-6 bg-void-black border-b border-matrix-green/30 select-none">
      
      {/* SECTOR 1: IDENTITY */}
      <div className="flex items-center gap-4">
        <div className="w-2 h-8 bg-matrix-green animate-pulse shadow-[0_0_10px_#00ff41]"></div>
        <h1 className="text-xl font-bold tracking-[0.2em] text-white font-mono">
          ALFA OS <span className="text-matrix-green text-sm">// OMNISCIENT</span>
        </h1>
      </div>

      {/* SECTOR 2: SYSTEM STATUS */}
      <div className="hidden md:flex items-center gap-6 text-xs font-mono text-matrix-green/50 tracking-wider">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-matrix-green"></span>
          NET: ONLINE
        </span>
        <span>LATENCY: 12ms</span>
        <span>UPTIME: 99.9%</span>
        <span>UNITS: {assetsCount.toString().padStart(3, '0')}</span>
      </div>

      {/* SECTOR 3: GLOBAL METRICS */}
      <div className="flex items-center gap-6 font-mono text-sm font-bold bg-matrix-green/5 px-4 py-1 rounded border border-matrix-green/10">
        <div className="flex flex-col items-end leading-none">
          <span className="text-[10px] text-amber-warning/70 uppercase">Revenue Yield</span>
          <span className="text-amber-warning tracking-wide">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="h-8 w-px bg-matrix-green/20"></div>

        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] text-matrix-green/70 uppercase">Traffic Mass</span>
          <span className="text-matrix-green tracking-wide">
            {totalTraffic.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}