import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import Layout from './Layout';
import Telemetry from './Telemetry';
import Mainframe from './Mainframe';
import MissionBoard from './MissionBoard';
import CLI from './CLI';
import BiosPanel from './BiosPanel';

// === SUPABASE CLIENT ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type AssetRow = Database['public']['Tables']['assets']['Row'];

export default function App() {
  // === STATE: DATA LAYER ===
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // === STATE: UI LAYER ===
  const [logs, setLogs] = useState<string[]>(['>> OMNISCIENT KERNEL v0.2 LOADED.', '>> WAITING FOR INPUT...']);
  const [showBios, setShowBios] = useState(false);
  const [showGenesis, setShowGenesis] = useState(false);
  const [telemetryAlert, setTelemetryAlert] = useState(false); // Visual Pulse for Revenue

  // === GENESIS FORM STATE ===
  const [genesisForm, setGenesisForm] = useState({ pri: '', sec: '' });
  const [genesisStatus, setGenesisStatus] = useState<string | null>(null);

  // === HELPERS ===
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  // === DATA FETCHING ===
  const fetchData = async () => {
    // Solo mostramos loading global en la carga inicial, no en refrescos de realtime
    if (assets.length === 0) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('total_score', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      if (assets.length === 0) addLog(`[SYSTEM] SYNC COMPLETE. ${data?.length} ACTIVE UNITS.`);
    } catch (err) {
      addLog(`[ERROR] DATA FETCH FAILED: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // === REALTIME NERVOUS SYSTEM ===
  useEffect(() => {
    const channel = supabase.channel('sentinel-link')
      // 1. LISTEN: NEW TRANSACTIONS (Revenue Pulse)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const newTx = payload.new as any;
          addLog(`[ALERT] $$$ NEW TRANSACTION DETECTED: $${newTx.amount} (ID: ${newTx.payhip_transaction_id})`);
          
          // Trigger Visual Alert
          setTelemetryAlert(true);
          setTimeout(() => setTelemetryAlert(false), 3000);

          // Refresh Data to calculate totals correctly
          fetchData();
        }
      )
      // 2. LISTEN: ASSET UPDATES (Live Score/Rarity Changes)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'assets' },
        (payload) => {
          const updatedAsset = payload.new as AssetRow;
          
          // Optimistic UI Update: Replace the item in the array immediately
          setAssets((prevAssets) => 
            prevAssets.map((a) => a.id === updatedAsset.id ? updatedAsset : a)
              .sort((a, b) => (b.total_score || 0) - (a.total_score || 0)) // Re-sort locally
          );

          addLog(`[UPDATE] ASSET ${updatedAsset.sku_slug} METRICS REFRESHED.`);
        }
      )
      // 3. LISTEN: NEW PINS (Radar Activity)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pins' },
        (payload) => {
          const newPin = payload.new as any;
          addLog(`[RADAR] NEW SIGNAL DETECTED: ${newPin.external_pin_id}. SCANNING FOR ORPHANS...`);
          // Note: MissionBoard handles its own scan logic, but we inform the operator here.
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          addLog('>> REALTIME UPLINK ESTABLISHED. LISTENING FOR EVENTS...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // === GENESIS LOGIC ===
  const handleGenesisSeed = async () => {
    if (!genesisForm.pri || !genesisForm.sec) {
      setGenesisStatus('[ERROR] BOTH MATRIX CODES REQUIRED');
      return;
    }
    setGenesisStatus('SEEDING NEW REALITY...');
    
    try {
      const { data, error } = await supabase.functions.invoke('genesis-seed', {
        body: { 
          primary_matrix_code: genesisForm.pri.toUpperCase(), 
          secondary_matrix_code: genesisForm.sec.toUpperCase() 
        }
      });

      if (error) throw error;
      
      setGenesisStatus(`SUCCESS: ${data.data.sku_slug} CREATED.`);
      addLog(`[GENESIS] NEW ASSET BORN: ${data.data.sku_slug}`);
      setGenesisForm({ pri: '', sec: '' });
      await fetchData();
      
      // Auto-close after delay
      setTimeout(() => {
        setShowGenesis(false);
        setGenesisStatus(null);
      }, 1500);

    } catch (err) {
      setGenesisStatus(`FAILURE: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  // === COMMAND BRIDGE ===
  const handleCommand = async (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    addLog(`root@sentinel:~$ ${command}`);

    try {
      switch (command) {
        case 'bios':
          setShowBios(prev => !prev);
          addLog(`[UI] BIOS PANEL ${!showBios ? 'OPENED' : 'CLOSED'}.`);
          break;

        case 'genesis':
          setShowGenesis(prev => !prev);
          addLog(`[UI] GENESIS PROTOCOL ${!showGenesis ? 'INITIATED' : 'ABORTED'}.`);
          break;

        case 'refresh':
        case 'reload':
          await fetchData();
          addLog('[SYS] MANUAL REFRESH EXECUTED.');
          break;

        case 'scan leaks':
          addLog('[CMD] INITIATING ORPHAN SCAN PROTOCOL...');
          const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-orphans');
          if (scanError) throw scanError;
          const orphanCount = scanData?.data?.length || 0;
          addLog(`[SUCCESS] SCAN COMPLETE. DETECTED ${orphanCount} ANOMALIES.`);
          break;

        case 'sync assets':
          addLog('[CMD] ESTABLISHING UPLINK TO PINTEREST...');
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

        case 'help':
          addLog('>> COMMANDS: bios, genesis, scan leaks, sync assets, refresh, clear');
          break;

        default:
          addLog(`[ERROR] UNKNOWN COMMAND: '${command}'. TRY 'help'.`);
      }
    } catch (err) {
      addLog(`[FATAL] EXECUTION FAILED: ${err instanceof Error ? err.message : 'Unknown Error'}`);
    }
  };

  // === METRICS CALCULATION ===
  const totalRevenue = assets.reduce((sum, a) => sum + (a.cached_revenue_score || 0), 0);
  const totalTraffic = assets.reduce((sum, a) => sum + (a.cached_traffic_score || 0), 0);

  return (
    <>
      {/* === OVERLAY: BIOS PANEL === */}
      {showBios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-10">
          <div className="w-full max-w-4xl h-[80vh] overflow-y-auto border border-matrix-green shadow-[0_0_50px_rgba(0,255,65,0.2)] bg-black relative">
            <button 
              onClick={() => setShowBios(false)}
              className="absolute top-2 right-2 text-matrix-green border border-matrix-green px-2 hover:bg-matrix-green hover:text-black z-10 font-mono"
            >
              [X]
            </button>
            <BiosPanel supabase={supabase} />
          </div>
        </div>
      )}

      {/* === OVERLAY: GENESIS MODAL === */}
      {showGenesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-lg border-2 border-hyper-violet bg-void-black p-6 shadow-[0_0_50px_rgba(147,51,234,0.3)] font-mono relative">
            <button 
              onClick={() => setShowGenesis(false)}
              className="absolute top-2 right-2 text-hyper-violet border border-hyper-violet px-2 hover:bg-hyper-violet hover:text-black"
            >
              [CLOSE]
            </button>

            <h2 className="text-xl font-bold text-hyper-violet mb-6 border-b border-hyper-violet/30 pb-2 flex items-center gap-2">
              <span className="animate-pulse">✦</span> GENESIS SEEDER
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-hyper-violet/70 mb-1">PRIMARY MATRIX (PARENT A)</label>
                <input 
                  value={genesisForm.pri}
                  onChange={e => setGenesisForm(prev => ({...prev, pri: e.target.value}))}
                  className="w-full bg-black border border-hyper-violet/50 text-white p-2 focus:outline-none focus:border-hyper-violet focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] uppercase placeholder-gray-700"
                  placeholder="CODE (Ex: TRAP26)"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-hyper-violet/70 mb-1">SECONDARY MATRIX (PARENT B)</label>
                <input 
                  value={genesisForm.sec}
                  onChange={e => setGenesisForm(prev => ({...prev, sec: e.target.value}))}
                  className="w-full bg-black border border-hyper-violet/50 text-white p-2 focus:outline-none focus:border-hyper-violet focus:shadow-[0_0_15px_rgba(147,51,234,0.2)] uppercase placeholder-gray-700"
                  placeholder="CODE (Ex: ANUEL)"
                />
              </div>

              {genesisStatus && (
                <div className={`text-xs p-2 border ${genesisStatus.includes('SUCCESS') ? 'border-matrix-green text-matrix-green' : 'border-alert-red text-alert-red'}`}>
                  {genesisStatus}
                </div>
              )}

              <button 
                onClick={handleGenesisSeed}
                className="w-full py-3 bg-hyper-violet text-black font-bold uppercase tracking-widest hover:bg-white transition-colors mt-4"
              >
                EXECUTE CREATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MAIN INTERFACE === */}
      <Layout
        // 1. NORTH: TELEMETRY
        header={
          <Telemetry 
            totalRevenue={totalRevenue} 
            totalTraffic={totalTraffic} 
            assetsCount={assets.length}
            alertMode={telemetryAlert} 
          />
        }

        // 2. CENTER: MAINFRAME
        mainframe={
          loading ? (
            <div className="w-full h-full bg-void-black flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-16 h-16 border-4 border-t-matrix-green border-r-transparent border-b-matrix-green border-l-transparent rounded-full animate-spin"></div>
              <div className="font-mono text-matrix-green text-sm tracking-widest animate-pulse">
                DECODING MATRIX STREAM...
              </div>
              <div className="flex gap-1 h-1 w-32 bg-matrix-green/10">
                <div className="h-full bg-matrix-green w-1/3 animate-[slideIn_1s_infinite]"></div>
              </div>
            </div>
          ) : (
            <Mainframe assets={assets} />
          )
        }

        // 3. EAST: WAR ROOM (LEAK HUNTER)
        warRoom={
          <div className="h-full overflow-y-auto bg-void-black border-l border-matrix-green/20 relative">
            <div className="sticky top-0 bg-void-black/90 backdrop-blur z-10 border-b border-matrix-green/10 p-2 text-[10px] text-matrix-green/50 font-mono text-center">
              [ INTEL_SECTOR_01 ]
            </div>
            <MissionBoard supabase={supabase} />
          </div>
        }

        // 4. SOUTH: CLI
        cli={
          <CLI logs={logs} onCommand={handleCommand} />
        }
      />
    </>
  );
}