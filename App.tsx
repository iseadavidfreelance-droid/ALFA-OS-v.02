import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import AssetCard from './AssetCard';
import MatrixDeck from './MatrixDeck';
import MissionBoard from './MissionBoard';
import CLI from './CLI';
import Layout from './Layout';

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

  // === COMMAND BRIDGE ===
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
          await fetchData();
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
          setSelectedMatrix(null);
          addLog('[UI] SHOWING FULL ASSET FLEET.');
          break;

        case 'help':
          addLog('>> AVAILABLE COMMANDS: scan leaks, sync assets, dashboard, fleet, clear');
          break;

        default:
          addLog(`[ERROR] UNKNOWN COMMAND: '${command}'.`);
      }
    } catch (err) {
      addLog(`[FATAL] EXECUTION FAILED: ${err instanceof Error ? err.message : 'Unknown Error'}`);
    }
  };

  // === FILTER LOGIC ===
  const filteredAssets = selectedMatrix 
    ? assets.filter(a => a.primary_matrix_id === selectedMatrix || a.secondary_matrix_id === selectedMatrix)
    : assets;

  const handleMatrixSelect = (id: string) => {
    if (selectedMatrix === id) {
      setSelectedMatrix(null);
      addLog('[FILTER] MATRIX DESELECTED.');
    } else {
      setSelectedMatrix(id);
      setViewMode('ASSETS');
      const mCode = matrices.find(m => m.id === id)?.code || 'UNKNOWN';
      addLog(`[FILTER] FOCUSING MATRIX: ${mCode}`);
    }
  };

  const totalRevenue = assets.reduce((sum, a) => sum + (a.cached_revenue_score || 0), 0);
  const totalTraffic = assets.reduce((sum, a) => sum + (a.cached_traffic_score || 0), 0);

  // === RENDER LAYOUT ===
  return (
    <Layout
      // 1. TELEMETRY RAIL (Header)
      header={
        <div className="w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-matrix-green animate-pulse shadow-[0_0_10px_#00ff41]"></div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-white">
              SENTINEL <span className="text-matrix-green/60 text-sm">KERNEL v0.2</span>
            </h1>
          </div>
          <div className="text-xs text-matrix-green/50 flex gap-4 font-mono">
             <span>NET: ONLINE</span>
             <span>SECURE: TRUE</span>
             <span>Ping: 12ms</span>
          </div>
        </div>
      }

      // 2. MAINFRAME (Center Content)
      mainframe={
        <div className="h-full w-full overflow-y-auto p-6 bg-gradient-to-b from-void-black to-[#0a0f0a]">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
               <div className="w-12 h-12 border-4 border-matrix-green border-t-transparent rounded-full animate-spin"></div>
               <span className="animate-pulse font-mono text-matrix-green">DECRYPTING DATA STREAMS...</span>
             </div>
          ) : viewMode === 'DASHBOARD' ? (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
              {/* METRICS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-matrix-green/30 bg-matrix-green/5 p-4 rounded shadow-[0_0_10px_rgba(0,255,65,0.05)]">
                  <h3 className="text-xs text-matrix-green/70 uppercase">Total Revenue</h3>
                  <div className="text-2xl font-bold text-white mt-1 font-mono">${totalRevenue.toFixed(2)}</div>
                </div>
                <div className="border border-matrix-green/30 bg-matrix-green/5 p-4 rounded shadow-[0_0_10px_rgba(0,255,65,0.05)]">
                  <h3 className="text-xs text-matrix-green/70 uppercase">Traffic Mass</h3>
                  <div className="text-2xl font-bold text-white mt-1 font-mono">{totalTraffic.toLocaleString()}</div>
                </div>
              </div>
              {/* LEAK HUNTER */}
              <MissionBoard supabase={supabase} />
            </div>
          ) : (
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="flex justify-between items-end border-b border-matrix-green/20 pb-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  ASSET FLEET {selectedMatrix && `[${matrices.find(m => m.id === selectedMatrix)?.code}]`}
                </h2>
                <span className="text-xs text-matrix-green/60 font-mono">{filteredAssets.length} UNITS</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAssets.map(asset => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
          )}
        </div>
      }

      // 3. WAR ROOM (Right Sidebar)
      warRoom={
        <div className="h-full w-full overflow-y-auto p-4 bg-void-black">
          <MatrixDeck 
             matrices={matrices} 
             selectedId={selectedMatrix || undefined}
             onSelectMatrix={handleMatrixSelect}
          />
        </div>
      }

      // 4. CLI (Footer)
      cli={
        <CLI logs={logs} onCommand={handleCommand} />
      }
    />
  );
}