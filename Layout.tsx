import React, { ReactNode } from 'react';

interface LayoutProps {
  header?: ReactNode;
  mainframe?: ReactNode;
  warRoom?: ReactNode;
  cli?: ReactNode;
}

export default function Layout({ header, mainframe, warRoom, cli }: LayoutProps) {
  return (
    // BIONIC GRID CONTAINER
    // Grid de 12 columnas.
    // Filas: Auto (Header), 1fr (Contenido Central), Auto (CLI).
    // gap-px + fondo matrix-green/10 crea las líneas de la cuadrícula visibles.
    <div className="h-screen w-screen grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-px bg-matrix-green/10 overflow-hidden font-mono text-matrix-green">
      
      {/* === CUADRANTE NORTE: HEADER === */}
      <header className="col-span-12 row-span-1 bg-void-black h-14 relative z-10 flex items-center px-4">
        {header || (
          <div className="w-full flex justify-between opacity-50">
            <span className="text-xs tracking-widest">[ TELEMETRY RAIL ]</span>
            <div className="h-px w-32 bg-matrix-green/30"></div>
          </div>
        )}
      </header>

      {/* === CUADRANTE CENTRO: MAINFRAME === */}
      <main className="col-span-9 row-span-1 bg-void-black relative overflow-hidden flex flex-col p-1">
        {mainframe || (
          <div className="flex-1 flex items-center justify-center border border-dashed border-matrix-green/20 m-4">
            <span className="text-xs animate-pulse">[ MAINFRAME VIEWPORT ]</span>
          </div>
        )}
      </main>

      {/* === CUADRANTE ESTE: WAR ROOM === */}
      <aside className="col-span-3 row-span-1 bg-void-black relative overflow-hidden flex flex-col p-1 border-l border-matrix-green/10">
        {warRoom || (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
            <span className="text-xs">[ WAR ROOM / INTEL ]</span>
            <div className="w-16 h-16 border border-matrix-green/30"></div>
          </div>
        )}
      </aside>

      {/* === CUADRANTE SUR: CLI === */}
      <footer className="col-span-12 row-span-1 bg-void-black h-64 relative z-20 border-t border-matrix-green/20">
        {cli || (
          <div className="h-full p-4 font-mono text-xs opacity-50">
            <div className="border-b border-matrix-green/30 pb-1 mb-2 w-full">[ TERMINAL UPLINK ]</div>
            <div>root@sentinel:~$ _</div>
          </div>
        )}
      </footer>

    </div>
  );
}