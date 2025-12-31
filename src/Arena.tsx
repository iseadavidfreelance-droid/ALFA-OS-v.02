import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database, Asset } from './database.types';
import AssetCard from './components/arena/AssetCard';
import ManifestModal from './components/modals/ManifestModal';
import ManualSaleModal from './components/modals/ManualSaleModal';

// === SUPABASE CLIENT ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default function Arena() {
  // === STATE ===
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // === MODAL STATE ===
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [sellingAsset, setSellingAsset] = useState<Asset | null>(null);

  // === DATA FETCHING ===
  const fetchHealthCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_asset_health_check')
        .select('*')
        .eq('is_retired', false)
        // Ordenar por urgencia de venta: Las ventas más recientes primero para monitorear tendencias activas
        .order('last_sale_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('[ARENA] Data Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();

    // Suscripción Realtime simple para refrescar si hay cambios en assets
    const channel = supabase.channel('arena-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        fetchHealthCheck();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // === HANDLERS ===
  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
  };

  const handleManualSale = (asset: Asset) => {
    setSellingAsset(asset);
  };

  const handleModalClose = () => {
    setEditingAsset(null);
    setSellingAsset(null);
    fetchHealthCheck(); // Refresh al cerrar para ver cambios
  };

  // === RENDER ===
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-void-black space-y-4">
        <div className="w-16 h-16 border-4 border-t-amber-warning border-r-transparent border-b-amber-warning border-l-transparent rounded-full animate-spin"></div>
        <div className="font-mono text-amber-warning text-sm tracking-widest animate-pulse">
          LOADING TACTICAL GRID...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-void-black p-8 custom-scrollbar">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8 border-b border-matrix-green/30 pb-4 sticky top-0 bg-void-black/95 backdrop-blur z-10">
        <div className="p-2 bg-matrix-green/10 rounded border border-matrix-green/30">
          <svg className="w-6 h-6 text-matrix-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-mono tracking-widest uppercase">
            ACTIVE ASSET GRID
          </h2>
          <div className="flex gap-4 text-[10px] font-mono text-gray-500 mt-1">
            <span>UNITS: {assets.length}</span>
            <span className="text-matrix-green">STATUS: MONITORING</span>
          </div>
        </div>
      </div>

      {/* GRID */}
      {assets.length === 0 ? (
        <div className="w-full py-20 border-2 border-dashed border-gray-800 flex items-center justify-center">
          <span className="text-gray-600 font-mono text-sm">NO ACTIVE ASSETS DETECTED</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
          {assets.map((asset) => (
            <div key={asset.id} className="h-full">
              <AssetCard 
                asset={asset} 
                onEdit={handleEdit} 
                onManualSale={handleManualSale} 
              />
            </div>
          ))}
        </div>
      )}

      {/* === MODALS (Integrados en Arena para acceso rápido) === */}
      <ManifestModal 
        asset={editingAsset} 
        isOpen={!!editingAsset} 
        onClose={handleModalClose} 
      />
      
      <ManualSaleModal 
        asset={sellingAsset} 
        isOpen={!!sellingAsset} 
        onClose={handleModalClose} 
      />

    </div>
  );
}