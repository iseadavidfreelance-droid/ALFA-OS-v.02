import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import AssetCard from './AssetCard';
import MatrixDeck from './MatrixDeck';
import MissionBoard from './MissionBoard'; // LeakHunter Widget
import CLI from './CLI';

// === SUPABASE CLIENT ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type AssetRow = Database['public']['Tables']['assets']['Row'];
type MatrixRow = Database['public']['Tables']['matrices']['Row'];

export default function App() {
  // === STATE: DATA LAYER ===
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [matrices, setMatrices] = useState<MatrixRow[]>([]);
  
  // === STATE: UI LAYER ===
  const [logs, setLogs] = useState<string[]>(['>> SYSTEM BOOT SEQUENCE INITIATED...', '>> KERNEL v0.2 LOADED.']);
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'ASSETS'>('DASHBOARD');
  const [selectedMatrix, setSelectedMatrix] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);

  // === HELPERS ===
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  // === DATA FETCHING ===
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel Fetch
      const [assetsRes, matricesRes] = await Promise.all([
        supabase.from('assets').select('*').order('total_score', { ascending: false }),
        supabase.from('matrices').select('*').order('code')
      ]);

      if (assetsRes.error) throw assetsRes.error;
      if (matricesRes.error) throw matricesRes.error;

      setAssets(assetsRes.data || []);
      setMatrices(matricesRes.data || []);
      
      addLog(`[SYSTEM] DATA SYNC COMPLETE. ${assetsRes.data?.length} ASSETS, ${matricesRes.data?.length} MATRICES LOADED.`);
    } catch (err) {
      addLog(`[ERROR] DATA FETCH FAILED: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // === COMMAND BRIDGE (THE BRAIN) ===
  const handleCommand = async (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    addLog(`root@sentinel:~$ ${command}`);

    try {
      switch (command) {
        case 'scan leaks':
          addLog('[CMD] INITIATING ORPHAN SCAN PROTOCOL...');
          const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-orphans');
          
          if (scanError) throw scanError;
          
          const orphanCount = scanData?.data?.length || 0;
          addLog(`[SUCCESS] SCAN COMPLETE. DETECTED ${orphanCount} ANOMALIES.`);
          if (orphanCount > 0) addLog(`[ALERT] RECOMMEND IMMEDIATE ADOPTION.`);
          break;

        case 'sync assets':
          addLog('[CMD] ESTABLISHING SECURE UPLINK TO PINTEREST (SCOPE: FULL)...');
          const { data: syncData, error: syncError } = await supabase.functions.invoke('cronos-sync', {
            body: { scope: 'full' }
          });

          if (syncError) throw syncError;
          
          const synced = syncData?.results?.full_sync?.total_synced || 0;
          addLog(`[SUCCESS] SYNC COMPLETE. ${synced} NODES UPDATED.`);
          await fetchData(); // Refresh UI
          break;

        case 'clear':
          setLogs([]);
          break;

        case 'dashboard':
          setViewMode('DASHBOARD');
          addLog('[UI] SWITCHING TO MAIN DASHBOARD.');
          break;

        case 'fleet':
          setViewMode('ASSETS');
          setSelectedMatrix(null); // Show all
          addLog('[UI] SHOWING FULL ASSET FLEET.');
          break;

        case 'help':
          addLog('>> AVAILABLE COMMANDS:');
          addLog(' - scan leaks   : Detect viral orphans');
          addLog(' - sync assets  : Force sync with Pinterest');
          addLog(' - dashboard    : View global metrics');
          addLog(' - fleet        : View all assets');
          addLog(' - clear        : Clear terminal');
          break;

        default:
          addLog(`[ERROR] UNKNOWN COMMAND: '${command}'. TYPE 'help' FOR MAN PAGES.`);
      }
    } catch (err) {
      addLog(`[FATAL] EXECUTION FAILED: ${err instanceof Error ? err.message : 'Unknown Error'}`);
    }
  };

  // === UI LOGIC ===
  const filteredAssets = selectedMatrix 
    ? assets.filter(a => a.primary_matrix_id === selectedMatrix || a.secondary_matrix_id === selectedMatrix)
    : assets;

  const handleMatrixSelect = (id: string) => {
    if (selectedMatrix === id) {
      setSelectedMatrix(null);
      addLog('[FILTER] MATRIX DESELECTED. SHOWING ALL.');
    } else {
      setSelectedMatrix(id);
      setViewMode('ASSETS');
      const mCode = matrices.find(m => m.id === id)?.code || 'UNKNOWN';
      addLog(`[FILTER] FOCUSING MATRIX: ${mCode}`);
    }
  };

  // Global Metrics Calculation
  const totalRevenue = assets.reduce((sum, a) => sum + (a.cached_revenue_score || 0), 0);
  const totalTraffic = assets.reduce((sum, a) => sum + (a.cached_traffic_score || 0), 0);

  return (
    <div className="min-h-screen bg-void-black text-matrix-green font-mono flex flex-col overflow-hidden relative">
      
      {/* HEADER */}
      <header className="h-14 border-b border-matrix-green/30 flex items-center justify-between px-6 bg-void-black z-20 shadow-[0_0_15px_rgba(0,255,65,0.1)]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-matrix-green animate-pulse shadow-[0_0_10px_#00ff41]"></div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-white">
            SENTINEL <span className="text-matrix-green/60 text-sm">INTERFACE v0.2</span>
          </h1>
        </div>
        <div className="text-xs text-matrix-green/50 flex gap-4">
          <span>NET: ONLINE</span>
          <span>SECURE: TRUE</span>
          <span>LATENCY: 12ms</span>
        </div>
      </header>

      {/* MAIN GRID LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT COL: MATRIX DECK (NAVIGATION) [Col-Span-3] */}
        <aside className="hidden lg:block lg:col-span-3 border-r border-matrix-green/20 p-4 overflow-y-auto bg-black/40">
          <h2 className="text-hyper-violet font-bold text-xs tracking-widest mb-4 border-b border-hyper-violet/30 pb-2">
            INFRASTRUCTURE MAP
          </h2>
          <div className="space-y-4">
             {/* We wrap MatrixDeck but force it to 1 column via class overrides or container constraint */}
             <div className="[&>div>div]:grid-cols-1">
               <MatrixDeck 
                  matrices={matrices} 
                  selectedId={selectedMatrix || undefined}
                  onSelectMatrix={handleMatrixSelect}
               />
             </div>
          </div>
        </aside>

        {/* CENTER COL: MAIN VIEW [Col-Span-6] */}
        <main className="lg:col-span-6 p-6 overflow-y-auto relative bg-gradient-to-b from-void-black to-[#0a0f0a]">
          
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
               <div className="w-12 h-12 border-4 border-matrix-green border-t-transparent rounded-full animate-spin"></div>
               <span className="animate-pulse">DECRYPTING DATA STREAMS...</span>
             </div>
          ) : viewMode === 'DASHBOARD' ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              
              {/* GLOBAL METRICS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-matrix-green/30 bg-matrix-green/5 p-4 rounded shadow-[0_0_10px_rgba(0,255,65,0.05)]">
                  <h3 className="text-xs text-matrix-green/70 uppercase">Total Revenue Yield</h3>
                  <div className="text-2xl font-bold text-white mt-1">${totalRevenue.toFixed(2)}</div>
                </div>
                <div className="border border-matrix-green/30 bg-matrix-green/5 p-4 rounded shadow-[0_0_10px_rgba(0,255,65,0.05)]">
                  <h3 className="text-xs text-matrix-green/70 uppercase">Aggregate Traffic Mass</h3>
                  <div className="text-2xl font-bold text-white mt-1">{totalTraffic.toLocaleString()}</div>
                </div>
              </div>

              {/* LEAK HUNTER WIDGET (Refactored MissionBoard) */}
              <div className="relative">
                <div className="absolute -left-2 -top-2 w-4 h-4 border-t border-l border-alert-red"></div>
                <div className="absolute -right-2 -bottom-2 w-4 h-4 border-b border-r border-alert-red"></div>
                <MissionBoard supabase={supabase} />
              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-end border-b border-matrix-green/20 pb-2">
                <h2 className="text-lg font-bold text-white">
                  ASSET FLEET {selectedMatrix && `[FILTER: ${matrices.find(m => m.id === selectedMatrix)?.code}]`}
                </h2>
                <span className="text-xs text-matrix-green/60">{filteredAssets.length} UNITS DEPLOYED</span>
              </div>
              
              {filteredAssets.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-matrix-green/30 text-matrix-green/50">
                  NO ASSETS FOUND IN THIS SECTOR.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAssets.map(asset => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* RIGHT COL: CLI TERMINAL [Col-Span-3] */}
        <aside className="hidden lg:block lg:col-span-3 h-[calc(100vh-3.5rem)] sticky top-14">
          <CLI logs={logs} onCommand={handleCommand} />
        </aside>

        {/* MOBILE CLI DRAWER (Visible only on small screens) */}
        <div className="lg:hidden col-span-1 h-64 border-t border-matrix-green/30">
           <CLI logs={logs} onCommand={handleCommand} />
        </div>

      </div>
    </div>
  );
}