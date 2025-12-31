import React from 'react';

export type SpectrumType = 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA';

interface SpectrumSelectorProps {
  active: SpectrumType;
  onSelect: (s: SpectrumType) => void;
}

const SPECTRUMS: SpectrumType[] = ['ALPHA', 'BETA', 'GAMMA', 'DELTA'];

export default function SpectrumSelector({ active, onSelect }: SpectrumSelectorProps) {
  return (
    <div className="flex items-center h-full px-4 border-l border-r border-matrix-green/20 bg-void-black select-none">
      <span className="text-[10px] font-mono tracking-widest text-matrix-green/40 mr-4">
        SPECTRUM:
      </span>
      
      <div className="flex items-center gap-2">
        {SPECTRUMS.map((spectrum) => {
          const isActive = active === spectrum;
          return (
            <button
              key={spectrum}
              onClick={() => onSelect(spectrum)}
              className={`
                text-[10px] font-mono font-bold px-3 py-1 border transition-all duration-200 uppercase rounded-sm
                ${isActive 
                  ? 'bg-matrix-green text-black border-matrix-green shadow-[0_0_15px_#00ff41]' 
                  : 'text-matrix-green/40 border-transparent hover:text-matrix-green hover:border-matrix-green/30 hover:bg-matrix-green/5'
                }
              `}
            >
              {spectrum}
            </button>
          );
        })}
      </div>
    </div>
  );
}