// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../../database.types.ts'
import { calculateAssetScore } from '../_shared/asset-logic.ts'

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void
  env: {
    get: (key: string) => string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayhipPayload {
  id: string;
  price: number;
  currency: string;
  product_link: string;
  email: string;
  // Otros campos que envía Payhip pero ignoramos por ahora
}

Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. SECURITY CHECK (Gatekeeper)
    const url = new URL(req.url);
    const receivedToken = url.searchParams.get('token');
    const secretToken = Deno.env.get('PAYHIP_SECRET_TOKEN');

    if (!receivedToken || receivedToken !== secretToken) {
      console.error('Security Breach: Invalid Token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. DATA INGESTION
    const payload = await req.json() as PayhipPayload;
    
    // Validación básica
    if (!payload.id || !payload.price || !payload.product_link) {
      throw new Error('Invalid Payload: Missing required fields (id, price, product_link)');
    }

    // Initialize Admin Client (Service Role required for inserts/updates)
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. ASSET DISCOVERY (Resolución de Identidad)
    // Intentamos buscar un activo cuyo payhip_link coincida o contenga el link del producto
    // Payhip suele enviar el permalink completo.
    const { data: asset, error: searchError } = await supabase
      .from('assets')
      .select('*')
      .ilike('payhip_link', `%${payload.product_link}%`)
      .limit(1)
      .maybeSingle(); // Usamos maybeSingle para no lanzar error si es null

    if (searchError) throw new Error(`DB Search Error: ${searchError.message}`);

    // Caso: Activo no encontrado (Orphan Transaction)
    if (!asset) {
      console.warn(`[ORPHAN_SALE] No asset found for Payhip Link: ${payload.product_link}. Transaction ID: ${payload.id}`);
      // RETORNA 200 OK para confirmar recepción a Payhip y evitar reintentos infinitos
      return new Response(JSON.stringify({ status: 'ignored', reason: 'Asset not linked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, 
      });
    }

    // 4. FINANCIAL COMMIT (Transacción)
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        payhip_transaction_id: payload.id,
        asset_id: asset.id,
        amount: payload.price,
        currency: payload.currency || 'USD',
        occurred_at: new Date().toISOString()
      });

    if (insertError) {
      // Manejo de Idempotencia: Si ya existe, es un reintento.
      if (insertError.code === '23505') { // Postgres unique_violation
        return new Response(JSON.stringify({ status: 'ignored', reason: 'Duplicate transaction' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      throw new Error(`Transaction Insert Failed: ${insertError.message}`);
    }

    console.log(`[SALE CONFIRMED] Asset: ${asset.sku_slug} | Amount: $${payload.price}`);

    // 5. THE TRIGGER (Reactive Score Update)
    // Ahora que la transacción está grabada, recalculamos todo el historial para este activo.
    
    // a) Traer todas las transacciones (incluida la nueva)
    const { data: allTransactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('asset_id', asset.id);
      
    if (txError) throw new Error(`History Fetch Error: ${txError.message}`);

    // b) Ejecutar lógica compartida (Shared Kernel)
    const scoreResult = await calculateAssetScore(
      supabase,
      asset,
      allTransactions || []
    );

    // c) Aplicar actualización al activo
    // calculateAssetScore retorna el payload listo con el Score y Rareza (Trinquete aplicado)
    const { error: updateError } = await supabase
      .from('assets')
      .update(scoreResult.updatePayload)
      .eq('id', asset.id);

    if (updateError) throw new Error(`Asset Score Update Failed: ${updateError.message}`);

    return new Response(
      JSON.stringify({ 
        status: 'success', 
        asset: asset.sku_slug,
        new_rarity: scoreResult.updatePayload.current_rarity,
        revenue_added: payload.price 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error(`[WEBHOOK_ERROR]`, error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Payhip reintentará si devolvemos 500
    });
  }
})