// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../../database.types.ts'

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

interface GenesisSeedRequest {
  primary_matrix_code: string;
  secondary_matrix_code: string;
  drive_link?: string;
  payhip_link?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Parse Input
    const { 
      primary_matrix_code, 
      secondary_matrix_code, 
      drive_link, 
      payhip_link 
    } = await req.json() as GenesisSeedRequest;

    if (!primary_matrix_code || !secondary_matrix_code) {
      throw new Error("Missing matrix codes. Both Primary and Secondary codes are required.");
    }

    // 2. Resolve Matrix UUIDs (DNA Check)
    const { data: matrices, error: matrixError } = await supabase
      .from('matrices')
      .select('id, code, type')
      .in('code', [primary_matrix_code, secondary_matrix_code]);

    if (matrixError) throw new Error(`Matrix lookup failed: ${matrixError.message}`);

    // Map codes to IDs safely
    const primaryMatrix = matrices?.find(m => m.code === primary_matrix_code);
    const secondaryMatrix = matrices?.find(m => m.code === secondary_matrix_code);

    if (!primaryMatrix) throw new Error(`Primary Matrix code not found: ${primary_matrix_code}`);
    if (!secondaryMatrix) throw new Error(`Secondary Matrix code not found: ${secondary_matrix_code}`);

    // 3. Generate Identity (Slug)
    // Formula: SKU-{SECONDARY}-{PRIMARY} (Upper Case)
    const skuSlug = `SKU-${secondary_matrix_code}-${primary_matrix_code}`.toUpperCase();

    // 4. Create Asset (Genesis)
    const { data: newAsset, error: insertError } = await supabase
      .from('assets')
      .insert({
        primary_matrix_id: primaryMatrix.id,
        secondary_matrix_id: secondaryMatrix.id,
        sku_slug: skuSlug,
        drive_link: drive_link || null,
        payhip_link: payhip_link || null,
        // Enforce Initial State
        lifecycle_state: 'INCUBATION',
        current_rarity: 'COMMON',
        highest_rarity_achieved: 'COMMON',
        // Initialize Cache
        cached_traffic_score: 0,
        cached_revenue_score: 0
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') { // Postgres unique_violation
        throw new Error(`Genesis Error: Asset with slug '${skuSlug}' already exists.`);
      }
      throw new Error(`Genesis Insert Failed: ${insertError.message}`);
    }

    // 5. Return Created Entity
    return new Response(
      JSON.stringify({ 
        status: 'success', 
        message: 'Asset successfully seeded.',
        data: newAsset 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Bad Request usually
    })
  }
})