import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import Layout from './Layout';
// Telemetry se reemplaza/integra en el nuevo Header compuesto
import Arena from './Arena';
import BioLab from './BioLab';
import Swarm from './Swarm';
import BlackBox from './BlackBox';
import MissionBoard from './MissionBoard';
import CLI from './CLI';
import BiosPanel from './BiosPanel';
import SpectrumSelector, { SpectrumType } from './SpectrumSelector';

// === NEW MODULES v1.1 ===
import ManifestModal from './components/modals/ManifestModal';
import ManualSaleModal from './components/modals/ManualSaleModal';
import { useTacticalActions } from './hooks/useTacticalActions';

// === SUPABASE CLIENT ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type AssetRow = Database['public']['Tables']['assets']['Row'];

export default function App() {
  // === HOOKS: TACTICAL LAYER ===
  const { spawnGenesis } = useTacticalActions();

  // === STATE: DATA LAYER ===
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // === STATE: UI LAYER ===
  const [activeSpectrum, setActiveSpectrum] = useState<SpectrumType>('ALPHA');
  const [logs, setLogs] = useState<string[]>(['>> OMNISCIENT KERNEL v0.2 LOADED.', '>> WAITING FOR INPUT...']);
  const [showBios, setShowBios] = useState(false);
  const [showGenesis, setShowGenesis] = useState(false);
  const [telemetryAlert, setTelemetryAlert] = useState(false); // Visual Pulse for Revenue

  // === OPERATIONAL MODAL STATES ===
  const [editingAsset, setEditingAsset] = useState<AssetRow | null>(null); // For ManifestModal
  const [sellingAsset, setSellingAsset] = useState<AssetRow | null>(null); // For ManualSaleModal

  // === GENESIS FORM STATE ===
  const [genesisForm, setGenesisForm] = useState({ pri: '', sec: '' });
  const [genesisStatus, setGenesisStatus] = useState<string | null>(null);

  // === HELPERS ===
  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  // === DATA FETCHING ===
  const fetchData = async () => {
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
          const newTx = payload.new as any;
          addLog(`[ALERT] $$$ NEW TRANSACTION DETECTED: $${newTx.amount} (ID: ${newTx.payhip_transaction_id})`);
          setTelemetryAlert(true);
          setTimeout(() => setTelemetryAlert(false), 3000);
          fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assets' }, (payload) => {
          const updatedAsset = payload.new as AssetRow;
          setAssets((prevAssets) => 
            prevAssets.map((a) => a.id === updatedAsset.id ? updatedAsset : a)
              .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
          );
          // Si estamos editando o vendiendo este asset, actualizamos el estado local
          setEditingAsset(curr => (curr?.id === updatedAsset.id ? updatedAsset : curr));
          setSellingAsset(curr => (curr?.id === updatedAsset.id ? updatedAsset : curr));
          
          addLog(`[UPDATE] ASSET ${updatedAsset.sku_slug} METRICS REFRESHED.`);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pins' }, (payload) => {
          const newPin = payload.new as any;
          addLog(`[RADAR] NEW SIGNAL DETECTED: ${newPin.external_pin_id}. SCANNING FOR ORPHANS...`);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          addLog('>> REALTIME UPLINK ESTABLISHED. LISTENING FOR EVENTS...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // === GENESIS LOGIC (THE TUNNEL) ===
  const handleGenesisSeed = async () => {
    if (!genesisForm.pri || !genesisForm.sec) {
      setGenesisStatus('[ERROR] BOTH MATRIX CODES REQUIRED');
      return;
    }
    setGenesisStatus('SEEDING NEW REALITY...');
    
    // Use Tactical Hook
    const result = await spawnGenesis({
      primaryId: genesisForm.pri.toUpperCase(), 
      secondaryId: genesisForm.sec.toUpperCase()
    });

    if (result.success && result.data?.data) {
      const newAsset = result.data.data;
      
      setGenesisStatus(`SUCCESS: ${newAsset.sku_slug} CREATED.`);
      addLog(`[GENESIS] NEW ASSET BORN: ${newAsset.sku_slug}`);
      setGenesisForm({ pri: '', sec: '' });
      
      // === THE TUNNEL: ACTIVATED ===
      setShowGenesis(false);
      setGenesisStatus(null);
      setEditingAsset(newAsset);
      
      await fetchData();
    } else {
      setGenesisStatus(`FAILURE: ${result.error?.message || 'Unknown Error'}`);
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
          addLog(`[SUCCESS] SCAN COMPLETE. DETECTED ${scanData?.data?.length || 0} ANOMALIES.`);
          break;
        case 'sync assets':
          addLog('[CMD] ESTABLISHING UPLINK TO PINTEREST...');
          const { data: syncData, error: syncError } = await supabase.functions.invoke('cronos-sync', { body: { scope: 'full' } });
          if (syncError) throw syncError;
          addLog(`[SUCCESS] SYNC COMPLETE. ${syncData?.results?.full_sync?.total_synced || 0} NODES UPDATED.`);
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

  // === RENDER LOGIC: SPECTRUM SWITCH ===
  
  // 1. MAINFRAME CONTENT
  let mainframeContent;
  switch (activeSpectrum) {
    case 'ALPHA':
      mainframeContent = loading ? (
        <div className="w-full h-full bg-void-black flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-16 h-16 border-4 border-t-matrix-green border-r-transparent border-b-matrix-green border-l-transparent rounded-full animate-spin"></div>
          <div className="font-mono text-matrix-green text-sm tracking-widest animate-pulse">
            DECODING MATRIX STREAM...
          </div>
        </div>
      ) : (
        assets.length > 0 ? (
          <Arena assets={assets} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-matrix-green/30 font-mono space-y-4">
             <div className="text-4xl opacity-20">∅</div>
             <div className="text-sm tracking-widest">LOCAL DATABASE EMPTY</div>
             <div className="text-xs border border-matrix-green/20 px-2 py-1 cursor-pointer hover:bg-matrix-green/10 transition-colors" onClick={() => setShowGenesis(true)}>
               [ INITIATE GENESIS ]
             </div>
          </div>
        )
      );
      break;
    
    case 'BETA':
      mainframeContent = <BioLab assets={assets} />;
      break;

    case 'GAMMA':
      mainframeContent = <Swarm assets={assets} />;
      break;

    case 'DELTA':
      mainframeContent = <BlackBox assets={assets} />;
      break;
  }

  // 2. WAR ROOM CONTENT
  let warRoomContent;
  switch (activeSpectrum) {
    case 'ALPHA':
      warRoomContent = (
        <div className="h-full overflow-y-auto bg-void-black border-l border-matrix-green/20 relative">
          <div className="sticky top-0 bg-void-black/90 backdrop-blur z-10 border-b border-matrix-green/10 p-2 text-[10px] text-matrix-green/50 font-mono text-center">
            [ INTEL_SECTOR_01 ]
          </div>
          <MissionBoard supabase={supabase} />
        </div>
      );
      break;

    default:
      warRoomContent = (
        <div className="h-full w-full flex items-center justify-center bg-void-black border-l border-matrix-green/10">
          <span className="text-xs font-mono text-matrix-green/30 animate-pulse">
            {`>> AWAITING SIGNAL [${activeSpectrum}]...`}
          </span>
        </div>
      );
      break;
  }

  // 3. HEADER CONTENT
  const layoutHeader = (
    <div className={`w-full h-full flex items-center justify-between bg-void-black border-b transition-colors duration-300 ${
      telemetryAlert ? 'border-amber-500/50 bg-amber-900/10' : 'border-matrix-green/30'
    }`}>
      {/* IZQUIERDA: TÍTULO */}
      <div className="flex items-center gap-4 px-6 border-r border-matrix-green/20 h-full">
         <div className={`w-1 h-6 animate-pulse ${telemetryAlert ? 'bg-amber-500' : 'bg-matrix-green'}`}></div>
         <h1 className="text-sm md:text-lg font-bold tracking-[0.2em] text-white font-mono whitespace-nowrap">
          SENTINEL <span className={`${telemetryAlert ? 'text-amber-500' : 'text-matrix-green'} text-xs opacity-80`}>INTERFACE</span>
         </h1>
      </div>

      {/* CENTRO/DERECHA: SPECTRUM SELECTOR */}
      <div className="flex-1 h-full flex justify-center">
        <SpectrumSelector active={activeSpectrum} onSelect={setActiveSpectrum} />
      </div>

      {/* DERECHA EXTREMA: INDICADORES */}
      <div className="flex items-center gap-6 px-6 h-full border-l border-matrix-green/20">
         {/* Mini Telemetry Data */}
         <div className="hidden lg:flex flex-col items-end text-[10px] font-mono leading-tight">
            <span className={telemetryAlert ? 'text-white' : 'text-amber-warning'}>
              REV: ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-matrix-green/70">
              TRF: {totalTraffic.toLocaleString()}
            </span>
         </div>

         <div className={`flex items-center gap-2 text-xs font-mono tracking-wider ${telemetryAlert ? 'text-amber-500' : 'text-matrix-green/50'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${telemetryAlert ? 'bg-amber-500 animate-ping' : 'bg-matrix-green'}`}></span>
            <span className="hidden md:inline">NET: ONLINE</span>
         </div>
      </div>
    </div>
  );

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

      {/* === OVERLAY: MANIFEST TUNNEL (EDIT ASSET) === */}
      <ManifestModal 
        asset={editingAsset} 
        isOpen={!!editingAsset} 
        onClose={() => {
          setEditingAsset(null);
          fetchData(); // Refresh data to reflect changes
        }} 
      />

      {/* === OVERLAY: MANUAL SALE (REVENUE) === */}
      <ManualSaleModal 
        asset={sellingAsset} 
        isOpen={!!sellingAsset} 
        onClose={() => {
          setSellingAsset(null);
          fetchData(); // Refresh data to reflect changes
        }} 
      />

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
                <label className="block text-xs text-hyper-violet/70 mb-1">PRIMARY MATRIX CODE</label>
                <input 
                  value={genesisForm.pri}
                  onChange={e => setGenesisForm(prev => ({...prev, pri: e.target.value}))}
                  className="w-full bg-black border border-hyper-violet/50 text-white p-2 focus:outline-none focus:border-hyper-violet uppercase"
                  placeholder="CODE (Ex: TRAP26)"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-hyper-violet/70 mb-1">SECONDARY MATRIX CODE</label>
                <input 
                  value={genesisForm.sec}
                  onChange={e => setGenesisForm(prev => ({...prev, sec: e.target.value}))}
                  className="w-full bg-black border border-hyper-violet/50 text-white p-2 focus:outline-none focus:border-hyper-violet uppercase"
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
        // 1. NORTH: COMPOSITE HEADER
        header={layoutHeader}

        // 2. CENTER: MAINFRAME (SWITCHED)
        mainframe={mainframeContent}

        // 3. EAST: WAR ROOM (SWITCHED)
        warRoom={warRoomContent}

        // 4. SOUTH: CLI (PERSISTENT)
        cli={<CLI logs={logs} onCommand={handleCommand} />}
      />
    </>
  );
}