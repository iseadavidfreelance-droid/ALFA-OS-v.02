import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import AssetCard from './AssetCard';
import BiosPanel from './BiosPanel';
import MissionBoard from './MissionBoard';

// === SUPABASE CLIENT INITIALIZATION ===
// Se asume que las variables de entorno están configuradas o usa placeholders para desarrollo
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type AssetRow = Database['public']['Tables']['assets']['Row'];

export default function App() {
  // === STATE MANAGEMENT ===
  // Inventario de Activos
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  // UI Toggles
  const [showBios, setShowBios] = useState(false);
  
  // Genesis Modal State
  const [showGenesis, setShowGenesis] = useState(false);
  const [genesisForm, setGenesisForm] = useState({ pri: '', sec: '' });
  const [genesisLoading, setGenesisLoading] = useState(false);
  const [genesisMsg, setGenesisMsg] = useState<string | null>(null);

  // === DATA FETCHING ===
  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('total_score', { ascending: false }); // Dominance Ranking

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Error fetching fleet:', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    // Nota: Aquí se podría añadir una suscripción realtime de Supabase
    // para actualizar el grid automáticamente si cambia el score.
  }, []);

  // === HANDLERS ===
  const handleGenesis = async () => {
    if (!genesisForm.pri || !genesisForm.sec) return;
    
    setGenesisLoading(true);
    setGenesisMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke('genesis-seed', {
        body: { 
          primary_matrix_code: genesisForm.pri, 
          secondary_matrix_code: genesisForm.sec 
        }
      });

      if (error) throw error;

      setGenesisMsg(`SUCCESS: UNIT ${data.data.sku_slug} DEPLOYED.`);
      
      // Recargar inventario para mostrar el nuevo activo
      await fetchAssets();
      
      // Limpiar formulario tras éxito breve
      setTimeout(() => {
        setShowGenesis(false);
        setGenesisMsg(null);
        setGenesisForm({ pri: '', sec: '' });
      }, 2000);

    } catch (err) {
      setGenesisMsg(`ERROR: ${err instanceof Error ? err.message : 'Genesis Failed'}`);
    } finally {
      setGenesisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono relative pb-24">
      
      {/* === HEADER === */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
          <h1 className="text-xl font-bold tracking-widest text-white">
            ALFA OS <span className="text-slate-600 text-sm">v0.2 GENESIS</span>
          </h1>
        </div>
        
        <button 
          onClick={() => setShowBios(!showBios)}
          className={`px-4 py-2 text-xs border font-bold transition-all uppercase tracking-wider ${
            showBios 
              ? 'bg-amber-900/20 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
              : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
          }`}
        >
          {showBios ? '[ CLOSE BIOS ]' : '[ BIOS CONFIG ]'}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">

        {/* === SECTOR SUPERIOR: MISIONES & BIOS === */}
        <div className="space-y-6">
          {/* Mission Board: Renderiza siempre, él gestiona si muestra Alerta o Nominal */}
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <MissionBoard supabase={supabase} />
          </section>

          {/* Bios Panel: Colapsable */}
          {showBios && (
            <section className="animate-in zoom-in-95 duration-300 border-t border-b border-amber-500/30 py-6 bg-amber-950/5">
              <BiosPanel supabase={supabase} />
            </section>
          )}
        </div>

        {/* === SECTOR PRINCIPAL: INVENTARIO DE ACTIVOS === */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-2">
            <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              ACTIVE FLEET INVENTORY ({assets.length})
            </h2>
            <div className="text-xs text-slate-500 font-bold">
              SORT: DOMINANCE_SCORE [DESC]
            </div>
          </div>

          {loadingAssets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-lg border border-slate-800 bg-slate-900/50 animate-pulse flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-600">DOWNLOADING TELEMETRY...</span>
                </div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/30">
              <p className="text-slate-500 mb-4 font-mono">NO ASSETS DEPLOYED IN THIS SECTOR.</p>
              <button 
                onClick={() => setShowGenesis(true)} 
                className="text-emerald-500 hover:text-emerald-400 underline text-sm font-bold uppercase tracking-wide"
              >
                INITIALIZE GENESIS PROTOCOL
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* === BOTÓN FLOTANTE: GENESIS (+) === */}
      <button
        onClick={() => setShowGenesis(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-black rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group border border-emerald-400"
        title="Execute Genesis Seed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* === MODAL: GENESIS SEED === */}
      {showGenesis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/50 w-full max-w-md p-8 rounded-xl shadow-2xl relative overflow-hidden">
            
            {/* Background FX */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <h2 className="text-xl font-bold font-mono text-emerald-400 mb-6 flex items-center gap-2 border-b border-emerald-900/50 pb-4">
              <span className="w-2 h-6 bg-emerald-500"></span>
              GENESIS PROTOCOL
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PRIMARY MATRIX CODE</label>
                <input 
                  value={genesisForm.pri}
                  onChange={(e) => setGenesisForm({...genesisForm, pri: e.target.value})}
                  placeholder="e.g. ANUEL"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-3 font-mono text-sm focus:border-emerald-500 focus:outline-none uppercase transition-colors rounded-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">SECONDARY MATRIX CODE</label>
                <input 
                  value={genesisForm.sec}
                  onChange={(e) => setGenesisForm({...genesisForm, sec: e.target.value})}
                  placeholder="e.g. TRAP26"
                  className="w-full bg-slate-950 border border-slate-700 text-white p-3 font-mono text-sm focus:border-emerald-500 focus:outline-none uppercase transition-colors rounded-sm"
                />
              </div>
            </div>

            {/* Status Message */}
            {genesisMsg && (
              <div className={`mt-4 p-3 text-xs font-mono border rounded-sm ${
                genesisMsg.includes('SUCCESS') 
                  ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400' 
                  : 'border-red-500 bg-red-900/20 text-red-400'
              }`}>
                {genesisMsg}
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowGenesis(false)}
                disabled={genesisLoading}
                className="flex-1 py-3 border border-slate-700 text-slate-400 font-mono text-xs hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider rounded-sm"
              >
                Abort
              </button>
              <button 
                onClick={handleGenesis}
                disabled={genesisLoading || !genesisForm.pri || !genesisForm.sec}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold font-mono text-xs transition-colors uppercase tracking-wider rounded-sm flex justify-center items-center gap-2"
              >
                {genesisLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black/50 border-t-black rounded-full animate-spin"></span>
                    EXECUTING...
                  </>
                ) : 'INITIATE SEED'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}