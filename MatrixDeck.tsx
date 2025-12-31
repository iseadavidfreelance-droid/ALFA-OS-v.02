import React from 'react';
import { Database } from './database.types';

type MatrixRow = Database['public']['Tables']['matrices']['Row'];

interface MatrixDeckProps {
  matrices: MatrixRow[];
  selectedId?: string;
  onSelectMatrix: (id: string) => void;
}

export default function MatrixDeck({ matrices, selectedId, onSelectMatrix }: MatrixDeckProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 text-hyper-violet border-b border-hyper-violet/30 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="font-mono font-bold tracking-wider text-sm">MATRIX_INFRASTRUCTURE</h3>
      </div>

      {matrices.length === 0 ? (
        <div className="border border-dashed border-hyper-violet/40 rounded p-8 text-center text-hyper-violet/50 font-mono text-xs">
          NO MATRICES DETECTED IN LOCAL CLUSTER.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {matrices.map((matrix) => {
            const isSelected = selectedId === matrix.id;
            
            return (
              <div
                key={matrix.id}
                onClick={() => onSelectMatrix(matrix.id)}
                className={`
                  relative group cursor-pointer transition-all duration-300 font-mono
                  border-2 p-6 flex flex-col items-center justify-center gap-2 min-h-[140px]
                  ${isSelected 
                    ? 'border-hyper-violet bg-hyper-violet/20 shadow-[0_0_20px_rgba(147,51,234,0.3)] scale-[1.02]' 
                    : 'border-hyper-violet/40 bg-void-black/80 hover:border-hyper-violet hover:bg-hyper-violet/10 hover:shadow-[0_0_10px_rgba(147,51,234,0.1)]'
                  }
                `}
              >
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-hyper-violet/60"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-hyper-violet/60"></div>

                {/* Matrix Code */}
                <span className={`text-xl font-bold tracking-widest ${isSelected ? 'text-white' : 'text-hyper-violet'}`}>
                  {matrix.code}
                </span>

                {/* Matrix Type Badge */}
                <span className={`
                  text-[10px] px-2 py-0.5 rounded uppercase tracking-wide
                  ${isSelected ? 'bg-hyper-violet text-black font-bold' : 'bg-hyper-violet/20 text-hyper-violet/80'}
                `}>
                  {matrix.type}
                </span>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 border border-hyper-violet/50 animate-pulse pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}