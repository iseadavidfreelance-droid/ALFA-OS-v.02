import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../database.types';

// === CONFIGURACIÓN CLIENTE ===
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// === INTERFACES DE ENTRADA ===
interface GenesisParams {
  primaryId: string;
  secondaryId: string;
}

interface ManifestUpdates {
  drive_link?: string;
  payhip_link?: string;
  sku_slug?: string;
}

interface ManualTransactionParams {
  assetId: string;
  amount: number;
  occurredAt: string; // ISO String
}

export const useTacticalActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 1. GENESIS SPAWN (Edge Function)
  const spawnGenesis = useCallback(async ({ primaryId, secondaryId }: GenesisParams) => {
    setIsLoading(true);
    console.log(`[TACTICAL] Spawning Genesis: PRI=${primaryId} SEC=${secondaryId}`);
    
    try {
      // Nota: Asumimos que la Edge Function ha sido actualizada para aceptar IDs 
      // o mapeamos IDs a códigos internamente si fuera necesario.
      const { data, error } = await supabase.functions.invoke('genesis-seed', {
        body: { 
          primary_matrix_id: primaryId, 
          secondary_matrix_id: secondaryId 
        }
      });

      if (error) throw error;
      console.log('[TACTICAL] Genesis Success:', data);
      return { success: true, data };
    } catch (err) {
      console.error('[TACTICAL] Genesis Failure:', err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. UPDATE MANIFEST (Direct DB Update)
  const updateManifest = useCallback(async (assetId: string, updates: ManifestUpdates) => {
    setIsLoading(true);
    console.log(`[TACTICAL] Updating Manifest for ${assetId}:`, updates);

    try {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', assetId)
        .select()
        .single();

      if (error) throw error;
      console.log('[TACTICAL] Manifest Updated:', data);
      return { success: true, data };
    } catch (err) {
      console.error('[TACTICAL] Manifest Update Failed:', err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. LOG MANUAL TRANSACTION (Insert with Source)
  const logManualTransaction = useCallback(async ({ assetId, amount, occurredAt }: ManualTransactionParams) => {
    setIsLoading(true);
    console.log(`[TACTICAL] Logging Manual Transaction: $${amount} for ${assetId}`);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          asset_id: assetId,
          amount: amount,
          occurred_at: occurredAt,
          source: 'MANUAL', // [NUEVO v1.1] Campo soportado en schema
          payhip_transaction_id: `MANUAL-${Date.now()}` // Fallback para constraint unique si aplica
        })
        .select()
        .single();

      if (error) throw error;
      
      // Trigger automático de recálculo tras venta manual
      await recalculateScore(assetId);

      console.log('[TACTICAL] Transaction Logged:', data);
      return { success: true, data };
    } catch (err) {
      console.error('[TACTICAL] Transaction Log Failed:', err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 4. REIGNITE ASSET (RPC Call)
  const reigniteAsset = useCallback(async (assetId: string) => {
    setIsLoading(true);
    console.log(`[TACTICAL] Reigniting Asset: ${assetId}`);

    try {
      const { error } = await supabase.rpc('trigger_reignite', {
        target_asset_id: assetId
      });

      if (error) throw error;
      console.log('[TACTICAL] Asset Reignited (Sync Pending).');
      return { success: true };
    } catch (err) {
      console.error('[TACTICAL] Reignite Failed:', err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 5. RECALCULATE SCORE (RPC Call)
  const recalculateScore = useCallback(async (assetId: string) => {
    setIsLoading(true);
    console.log(`[TACTICAL] Recalculating Score: ${assetId}`);

    try {
      const { error } = await supabase.rpc('recalculate_asset_score', {
        target_asset_id: assetId
      });

      if (error) throw error;
      console.log('[TACTICAL] Score Recalculated.');
      return { success: true };
    } catch (err) {
      console.error('[TACTICAL] Recalculation Failed:', err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 6. ASSIMILATE ORPHAN (Pin Adoption)
  const assimilateOrphan = useCallback(async (pinId: string, assetId: string) => {
    setIsLoading(true);
    console.log(`[TACTICAL] Assimilating Pin ${pinId} into Asset ${assetId}`);

    try {
      const { data, error } = await supabase
        .from('pins')
        .update({ asset_id: assetId })
        .eq('id', pinId) // Asumimos UUID interno, cambiar a 'external_pin_id' si se usa ID de plataforma
        .select()
        .single();

      if (error) throw error;

      // Actualizamos tráfico del activo tras la asimilación
      await recalculateScore(assetId);

      console.log('[TACTICAL] Assimilation Complete:', data);
      return { success: true, data };
    } catch (err) {
      console.error('[TACTICAL] Assimilation Failed:', err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 7. RETIRE ASSET (Soft Delete)
  const retireAsset = useCallback(async (assetId: string) => {
    setIsLoading(true);
    console.log(`[TACTICAL] Retiring Asset: ${assetId}`);

    try {
      const { data, error } = await supabase
        .from('assets')
        .update({ is_retired: true }) // [NUEVO v1.1] Flag de retiro
        .eq('id', assetId)
        .select()
        .single();

      if (error) throw error;
      console.log('[TACTICAL] Asset Retired:', data);
      return { success: true, data };
    } catch (err) {
      console.error('[TACTICAL] Retirement Failed:', err);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    spawnGenesis,
    updateManifest,
    logManualTransaction,
    reigniteAsset,
    recalculateScore,
    assimilateOrphan,
    retireAsset
  };
};