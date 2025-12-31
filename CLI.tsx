import React, { useEffect, useRef, useState } from 'react';

interface CLIProps {
  logs: string[];
  onCommand: (cmd: string) => void;
}

export default function CLI({ logs, onCommand }: CLIProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan nuevos logs
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-void-black border-r border-matrix-green/30 shadow-[0_0_20px_rgba(0,255,65,0.05)] font-mono text-sm relative overflow-hidden">
      
      {/* HEADER DECORATIVO */}
      <div className="bg-matrix-green/10 border-b border-matrix-green/30 px-4 py-2 flex justify-between items-center select-none">
        <span className="text-matrix-green font-bold tracking-widest text-xs flex items-center gap-2">
          <span className="w-2 h-2 bg-matrix-green animate-pulse"></span>
          TERMINAL_LINK_V0.2
        </span>
        <span className="text-[10px] text-matrix-green/60">CONNECTED</span>
      </div>

      {/* LOG STREAM AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-matrix-green/20 scrollbar-track-transparent">
        {logs.length === 0 && (
          <div className="text-matrix-green/30 italic text-xs py-4">
            >> AWAITING SYSTEM TELEMETRY...
          </div>
        )}
        
        {logs.map((log, index) => (
          <div 
            key={index} 
            className="text-matrix-green/90 break-words animate-[fadeIn_0.2s_ease-out]"
          >
            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}]</span>
            {log}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-black border-t border-matrix-green/30 flex items-center gap-2 relative z-10">
        <span className="text-matrix-green font-bold animate-pulse">{'>'}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent border-none outline-none text-matrix-green placeholder-matrix-green/30 focus:ring-0"
          placeholder="ENTER_COMMAND..."
        />
        {/* Cursor visual extra si el input está vacío y enfocado (opcional, simulado) */}
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-matrix-green/50 m-1"></div>
      </div>
    </div>
  );
}