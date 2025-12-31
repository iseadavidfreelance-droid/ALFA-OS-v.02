import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

type AssetRow = Database['public']['Tables']['assets']['Row'];
type MatrixRow = Database['public']['Tables']['matrices']['Row'];

interface BioLabProps {
  assets: AssetRow[];
}

// === SUPABASE CLIENT (Local Instance) ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default function BioLab({ assets }: BioLabProps) {
  // === STATE ===
  const [matrices, setMatrices] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(true);

  // === FETCH DATA ===
  useEffect(() => {
    const fetchMatrices = async () => {
      setLoading(true);
      const { data } = await supabase.from('matrices').select('*');
      if (data) {
        setMatrices(data);
      }
      setLoading(false);
    };
    fetchMatrices();
  }, []);

  // === LOGIC: DNA YIELD (Agrupación por Matriz Primaria) ===
  const dnaYieldData = useMemo(() => {
    if (matrices.length === 0) return [];

    // Solo nos interesan las matrices que actúan como Primarias
    const primaryMatrices = matrices.filter(m => m.type === 'PRIMARY');

    const stats = primaryMatrices.map(matrix => {
      // Filtrar hijos de esta matriz
      const offspring = assets.filter(a => a.primary_matrix_id === matrix.id);
      
      const count = offspring.length;
      const totalRevenue = offspring.reduce((sum, a) => sum + (a.cached_revenue_score || 0), 0);
      const totalScore = offspring.reduce((sum, a) => sum + (a.total_score || 0), 0);
      const avgScore = count > 0 ? totalScore / count : 0;

      return {
        ...matrix,
        offspring_count: count,
        total_revenue: totalRevenue,
        avg_score: avgScore
      };
    });

    // Ordenar por Revenue DESC
    return stats.sort((a, b) => b.total_revenue - a.total_revenue);
  }, [matrices, assets]);

  // === LOGIC: HYBRID THEORY (Heatmap) ===
  const hybridHeatmap = useMemo(() => {
    const primaries = matrices.filter(m => m.type === 'PRIMARY').sort((a, b) => a.code.localeCompare(b.code));
    const secondaries = matrices.filter(m => m.type === 'SECONDARY').sort((a, b) => a.code.localeCompare(b.code));

    // Mapa 2D: [PrimaryID][SecondaryID] = Total Score
    const grid: Record<string, Record<string, number>> = {};
    let maxCellScore = 0;

    // Inicializar grid
    primaries.forEach(p => {
      grid[p.id] = {};
      secondaries.forEach(s => {
        grid[p.id][s.id] = 0;
      });
    });

    // Llenar grid
    assets.forEach(asset => {
      if (asset.primary_matrix_id && asset.secondary_matrix_id) {
        // Asegurar que existen en el grid (por si hay matrices borradas referenciadas)
        if (!grid[asset.primary_matrix_id]) grid[asset.primary_matrix_id] = {};
        
        const currentVal = grid[asset.primary_matrix_id][asset.secondary_matrix_id] || 0;
        const newVal = currentVal + (asset.total_score || 0);
        
        grid[asset.primary_matrix_id][asset.secondary_matrix_id] = newVal;

        if (newVal > maxCellScore) maxCellScore = newVal;
      }
    });

    return { primaries, secondaries, grid, maxCellScore };
  }, [matrices, assets]);

  // === RENDER: LOADING ===
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-void-black space-y-4">
        <div className="w-12 h-12 border-4 border-t-hyper-violet border-r-transparent border-b-hyper-violet border-l-transparent rounded-full animate-spin"></div>
        <div className="text-hyper-violet font-mono text-sm tracking-widest animate-pulse">
          SEQUENCING DNA...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-void-black p-8 space-y-16 custom-scrollbar font-mono">
      
      {/* ==================================================================================
          SECCIÓN 1: DNA YIELD (NETWORK PERFORMANCE)
      ================================================================================== */}
      <section>
        <div className="flex items-center gap-3 mb-6 border-b border-hyper-violet/30 pb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-hyper-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h2 className="text-xl font-bold text-hyper-violet tracking-widest uppercase">
            DNA YIELD // PRIMARY STRAINS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dnaYieldData.map((matrix) => {
            const isDormant = matrix.total_revenue === 0;
            
            return (
              <div 
                key={matrix.id}
                className={`
                  relative p-5 border transition-all duration-300
                  ${isDormant 
                    ? 'border-gray-800 bg-gray-900/10 text-gray-500' 
                    : 'border-hyper-violet/50 bg-hyper-violet/5 hover:bg-hyper-violet/10 hover:shadow-[0_0_20px_rgba(147,51,234,0.2)] hover:border-hyper-violet'
                  }
                `}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`text-2xl font-bold tracking-tighter ${isDormant ? 'text-gray-600' : 'text-white'}`}>
                    {matrix.code}
                  </div>
                  <div className={`text-[10px] px-2 py-1 border rounded uppercase ${isDormant ? 'border-gray-700' : 'border-hyper-violet text-hyper-violet'}`}>
                    {isDormant ? 'DORMANT' : 'ACTIVE'}
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-70">OFFSPRING</span>
                    <span className="font-bold">{matrix.offspring_count} UNITS</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-70">REVENUE</span>
                    <span className={`font-bold text-lg ${isDormant ? 'text-gray-500' : 'text-hyper-violet'}`}>
                      ${matrix.total_revenue.toLocaleString()}
                    </span>
                  </div>
                  {/* Micro Bar */}
                  {!isDormant && (
                     <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-2">
                       <div 
                         style={{ width: `${Math.min((matrix.avg_score / 5000) * 100, 100)}%` }} 
                         className="h-full bg-hyper-violet"
                        ></div>
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================================================================================
          SECCIÓN 2: HYBRID THEORY (CROSS-BREED HEATMAP)
      ================================================================================== */}
      <section>
        <div className="flex items-center gap-3 mb-6 border-b border-matrix-green/30 pb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-matrix-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <h2 className="text-xl font-bold text-matrix-green tracking-widest uppercase">
            HYBRID THEORY // CROSS-BREED HEATMAP
          </h2>
        </div>

        <div className="w-full overflow-x-auto border border-matrix-green/20 bg-black p-4">
          <table className="border-collapse table-auto w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-matrix-green/50">PRI \ SEC</th>
                {hybridHeatmap.secondaries.map(sec => (
                  <th key={sec.id} className="p-2 text-center text-matrix-green font-bold border-b border-matrix-green/20 min-w-[60px]">
                    {sec.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hybridHeatmap.primaries.map(pri => (
                <tr key={pri.id}>
                  {/* Row Header (Primary) */}
                  <td className="p-2 text-left text-matrix-green font-bold border-r border-matrix-green/20">
                    {pri.code}
                  </td>
                  
                  {/* Cells */}
                  {hybridHeatmap.secondaries.map(sec => {
                    const score = hybridHeatmap.grid[pri.id]?.[sec.id] || 0;
                    const intensity = hybridHeatmap.maxCellScore > 0 
                      ? score / hybridHeatmap.maxCellScore 
                      : 0;
                    
                    // Determine Color Class based on intensity
                    let bgClass = 'bg-void-black';
                    let textClass = 'text-transparent';
                    
                    if (score > 0) {
                        textClass = 'text-black font-bold group-hover:text-white';
                        if (intensity > 0.8) bgClass = 'bg-matrix-green'; // High
                        else if (intensity > 0.4) bgClass = 'bg-matrix-green/60'; // Med
                        else bgClass = 'bg-matrix-green/20'; // Low
                    }

                    return (
                      <td 
                        key={sec.id} 
                        className="p-1 border border-matrix-green/5 relative group cursor-help"
                        title={`Cross: ${pri.code} x ${sec.code} | Score: ${score.toLocaleString()}`}
                      >
                        <div className={`w-full h-8 flex items-center justify-center ${bgClass} transition-colors duration-300`}>
                           <span className={`text-[9px] ${textClass} opacity-0 group-hover:opacity-100`}>
                             {score > 999 ? (score/1000).toFixed(1) + 'k' : score}
                           </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-matrix-green/40 mt-2 font-mono flex justify-end gap-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-matrix-green/20 block"></span> LOW YIELD</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-matrix-green/60 block"></span> MED YIELD</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-matrix-green block"></span> HIGH YIELD</span>
        </div>
      </section>

    </div>
  );
}