import React, { ReactNode } from 'react';

interface LayoutProps {
  header?: ReactNode;
  mainframe?: ReactNode;
  warRoom?: ReactNode; // Cuadrante ESTE
  cli?: ReactNode;     // Cuadrante SUR
}

export default function Layout({ header, mainframe, warRoom, cli }: LayoutProps) {
  return (
    // BIONIC GRID CONTAINER
    // gap-px + bg-green-900/20 crea las líneas visibles del grid
    <div className="h-screen w-screen grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-px bg-green-900/20 overflow-hidden font-mono text-matrix-green bg-void-black">
      
      {/* === NORTE: HEADER (Telemetry Rail) === */}
      <header className="col-span-12 row-span-1 h-12 bg-void-black flex items-center px-4 relative z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        {header || (
          <div className="w-full flex justify-between items-center opacity-50">
            <span className="text-green-500 text-xs tracking-widest">[ TELEMETRY RAIL ]</span>
            <div className="h-px w-24 bg-green-500/30"></div>
          </div>
        )}
      </header>

      {/* === CENTRO: MAINFRAME (Primary Viewport) === */}
      <main className="col-span-9 row-span-1 bg-void-black relative overflow-hidden flex flex-col">
        {mainframe || (
          <div className="flex-1 flex flex-col items-center justify-center border-dashed border-green-900/30 m-4 border rounded">
            <span className="text-green-500 text-xs animate-pulse">[ MAINFRAME ]</span>
            <span className="text-[10px] text-green-900 mt-2">NO SIGNAL INPUT</span>
          </div>
        )}
      </main>

      {/* === ESTE: WAR ROOM (Sidebar/Intel) === */}
      <aside className="col-span-3 row-span-1 bg-void-black border-l border-green-900/30 relative overflow-hidden flex flex-col">
        {warRoom || (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <span className="text-green-500 text-xs mb-4">[ WAR ROOM ]</span>
            <div className="w-full h-32 border border-green-900/40 bg-green-900/5"></div>
            <div className="w-full h-32 border border-green-900/40 bg-green-900/5 mt-2"></div>
          </div>
        )}
      </aside>

      {/* === SUR: CLI (Terminal Uplink) === */}
      <footer className="col-span-12 row-span-1 h-48 bg-void-black border-t border-green-900/50 relative overflow-hidden flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-20">
        {cli || (
          <div className="flex-1 p-4 flex flex-col">
             <div className="flex items-center gap-2 border-b border-green-900/30 pb-1 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-500 text-xs tracking-wider">[ TERMINAL UPLINK ]</span>
             </div>
             <div className="font-mono text-xs text-green-500/50">
               > SYSTEM READY...
               <br />
               > WAITING FOR COMMAND...
             </div>
          </div>
        )}
      </footer>

    </div>
  );
}