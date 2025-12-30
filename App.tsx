import React from 'react';
import { Database } from './database.types';
import AssetCard from './AssetCard';

// Helper to mock data for preview
const mockAsset = (
  slug: string, 
  current: Database['public']['Enums']['rarity_tier'], 
  highest: Database['public']['Enums']['rarity_tier'],
  traffic: number,
  revenue: number
): Database['public']['Tables']['assets']['Row'] => ({
  id: crypto.randomUUID(),
  sku_slug: slug,
  current_rarity: current,
  highest_rarity_achieved: highest,
  cached_traffic_score: traffic,
  cached_revenue_score: revenue,
  total_score: traffic + revenue,
  lifecycle_state: 'MONETIZATION',
  primary_matrix_id: null,
  secondary_matrix_id: null,
  drive_link: null,
  payhip_link: null,
  created_at: new Date().toISOString(),
  last_synced_at: new Date().toISOString()
});

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-mono">
      <header className="mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">ALFA OS v0.2 [Genesis Kernel]</h1>
        <p className="text-slate-400">Database Schema & TypeScript Definitions</p>
      </header>

      <main className="grid gap-8 max-w-6xl mx-auto">
        
        {/* === NEW SECTION: COMPONENT PREVIEW === */}
        <section className="bg-slate-950 rounded-xl p-8 border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></span>
            UI Component: AssetCard.tsx
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Case 1: Standard Growth */}
            <AssetCard 
              asset={mockAsset('SKU-TRAP26-ANUEL', 'UNCOMMON', 'UNCOMMON', 120.5, 50.0)} 
            />

            {/* Case 2: Ratchet Effect (Ghost) */}
            {/* Note: Current is COMMON, but Highest was LEGENDARY. Visualizes "The Fall" but keeps status */}
            <AssetCard 
              asset={mockAsset('SKU-DRILL-CHIEF', 'COMMON', 'LEGENDARY', 15.0, 5000.0)} 
            />

            {/* Case 3: High Performance */}
            <AssetCard 
              asset={mockAsset('SKU-REGGAETON-BAD', 'EPIC', 'EPIC', 850.0, 1200.0)} 
            />

          </div>
          <p className="mt-4 text-xs text-slate-500 text-center">
            *Visual simulation of the Asset Card component demonstrating Rarity borders, Ratchet Ghost mechanism, and Dual Progress bars.*
          </p>
        </section>

        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
            <span className="w-2 h-8 bg-emerald-500 mr-3 rounded-sm"></span>
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-900 rounded border border-slate-700">
              <span className="block text-slate-500 mb-1">Database Engine</span>
              <span className="text-white font-semibold">PostgreSQL (Supabase)</span>
            </div>
            <div className="p-4 bg-slate-900 rounded border border-slate-700">
              <span className="block text-slate-500 mb-1">Total Tables</span>
              <span className="text-white font-semibold">5 (System, Matrices, Assets, Pins, Transactions)</span>
            </div>
             <div className="p-4 bg-slate-900 rounded border border-slate-700">
              <span className="block text-slate-500 mb-1">Edge Functions</span>
              <span className="text-white font-semibold">4 (orphans, cronos, genesis, adopt)</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ORPHAN SCANNER */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-amber-500 mr-3 rounded-sm"></span>
              Func: scan-orphans
            </h2>
            <div className="mb-4 text-sm text-slate-300">
              <p className="mb-2"><strong>Logic:</strong> Identifies "Red Alert" orphans (unlinked pins) that have exceeded the viral threshold.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Fetches <code>ORPHAN_VIRALITY_TRIGGER</code> from <code>system_settings</code>.</li>
                <li>Scans <code>pins</code> where <code>asset_id IS NULL</code>.</li>
                <li>Filters by <code>last_stats-&gt;&gt;outbound_clicks &gt; trigger</code>.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-amber-300 block mb-2">POST /scan-orphans</code>
            </div>
          </div>

          {/* CRONOS SYNC */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-red-500 mr-3 rounded-sm"></span>
              Func: cronos-sync
            </h2>
            <div className="mb-4 text-sm text-slate-300">
              <p className="mb-2"><strong>Logic:</strong> Master orchestrator for system updates.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Scope 'top_pins':</strong> Sorts pins by traffic, selects top 20%, simulates API refresh.</li>
                <li><strong>Scope 'financial':</strong> Sums transactions, applies weights, updates Asset Score & Rarity using the <code>Asset Logic</code> kernel.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-red-300 block mb-2">POST /cronos-sync {'{ "scope": "full" }'}</code>
            </div>
          </div>

          {/* GENESIS SEED */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-green-500 mr-3 rounded-sm"></span>
              Func: genesis-seed
            </h2>
            <div className="mb-4 text-sm text-slate-300">
                <p className="mb-2"><strong>Logic:</strong> Asset Factory & DNA Verification.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Resolves Matrix Codes to UUIDs.</li>
                <li>Generates immutable <code>sku_slug</code>: <code>SKU-[SEC]-[PRI]</code>.</li>
                <li>Enforces <code>INCUBATION</code> & <code>COMMON</code>.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-green-300 block mb-2">POST /genesis-seed</code>
            </div>
          </div>

          {/* ADOPT ORPHAN */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <span className="w-2 h-8 bg-teal-500 mr-3 rounded-sm"></span>
              Func: adopt-orphan
            </h2>
            <div className="mb-4 text-sm text-slate-300">
                <p className="mb-2"><strong>Logic:</strong> Links Pin to Asset & Updates Gravity.</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Validates existence of Pin & Asset.</li>
                <li>Updates <code>pins.asset_id</code>.</li>
                <li><strong>Trigger:</strong> Immediately recalculates Asset's <code>cached_traffic_score</code> and Rarity using the Core Logic.</li>
              </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
              <code className="text-xs text-teal-300 block mb-2">POST /adopt-orphan</code>
               <pre className="text-xs text-slate-500">
{`{ "pin_id": "...", "asset_id": "..." }`}
                </pre>
            </div>
          </div>

        </section>

        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
            <span className="w-2 h-8 bg-blue-500 mr-3 rounded-sm"></span>
            database.types.ts Preview
          </h2>
          <p className="mb-4 text-slate-400 text-sm">
            This file defines the exact TypeScript interfaces reflecting the SQL schema. It handles JSONB types, Enums, and nullable fields automatically.
          </p>
          <div className="bg-slate-950 p-4 rounded overflow-x-auto border border-slate-800">
            <pre className="text-xs text-blue-300">
              {`// See database.types.ts for full implementation used by the backend`}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}