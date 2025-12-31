import React, { useEffect, useState } from 'react';
import { Database } from '../../../database.types';
import { useTacticalActions } from '../../hooks/useTacticalActions';

type AssetRow = Database['public']['Tables']['assets']['Row'];

interface ManifestModalProps {
  asset: AssetRow | null; // Nullable para seguridad, aunque se controla con isOpen
  isOpen: boolean;
  onClose: () => void;
}

export default function ManifestModal({ asset, isOpen, onClose }: ManifestModalProps) {
  const { updateManifest, isLoading } = useTacticalActions();

  // === FORM STATE ===
  const [form, setForm] = useState({
    sku: '',
    drive: '',
    payhip: ''
  });

  // === VALIDATION STATE ===
  const [errors, setErrors] = useState({
    drive: false,
    payhip: false
  });

  // === INIT ===
  useEffect(() => {
    if (isOpen && asset) {
      setForm({
        sku: asset.sku_slug || '',
        drive: asset.drive_link || '',
        payhip: asset.payhip_link || ''
      });
      setErrors({ drive: false, payhip: false });
    }
  }, [isOpen, asset]);

  // === HANDLERS ===
  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Real-time Validation
    if (field === 'drive') {
      // Valid if empty (clearing) OR contains domain
      const isValid = value === '' || value.includes('drive.google.com');
      setErrors(prev => ({ ...prev, drive: !isValid }));
    }
    
    if (field === 'payhip') {
      const isValid = value === '' || value.includes('payhip.com');
      setErrors(prev => ({ ...prev, payhip: !isValid }));
    }
  };

  const handleSave = async () => {
    if (!asset) return;
    
    const result = await updateManifest(asset.id, {
      sku_slug: form.sku.toUpperCase(), // Enforce Uppercase SKU
      drive_link: form.drive || null,
      payhip_link: form.payhip || null
    });

    if (result.success) {
      onClose();
    }
  };

  // === RENDER ===
  if (!isOpen || !asset) return null;

  const hasErrors = errors.drive || errors.payhip || !form.sku;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-void-black border border-slate-600 shadow-[0_0_40px_rgba(100,116,139,0.2)] font-mono relative">
        
        {/* HEADER */}
        <div className="bg-slate-900/50 border-b border-slate-700 p-4 flex justify-between items-center">
          <h2 className="text-slate-200 font-bold tracking-widest uppercase flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            EDIT MANIFEST // <span className="text-matrix-green">{asset.sku_slug}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white hover:bg-slate-700 px-2 rounded transition-colors"
          >
            [X]
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          
          {/* FIELD: SKU */}
          <div>
            <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wide">Identity (SKU Slug)</label>
            <input 
              type="text" 
              value={form.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              className="w-full bg-black border border-slate-700 text-white p-2 text-sm focus:outline-none focus:border-matrix-green focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all uppercase"
              placeholder="SKU-XXX-YYY"
            />
          </div>

          {/* FIELD: DRIVE LINK */}
          <div>
            <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wide flex justify-between">
              <span>Storage Link (G-Drive)</span>
              {errors.drive && <span className="text-alert-red font-bold animate-pulse">INVALID DOMAIN</span>}
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={form.drive}
                onChange={(e) => handleChange('drive', e.target.value)}
                className={`w-full bg-black border text-slate-300 p-2 pl-8 text-xs focus:outline-none transition-all ${
                  errors.drive 
                    ? 'border-alert-red focus:border-alert-red text-alert-red' 
                    : 'border-slate-700 focus:border-blue-500'
                }`}
                placeholder="https://drive.google.com/..."
              />
              <span className="absolute left-2 top-2 text-slate-600">📂</span>
            </div>
          </div>

          {/* FIELD: PAYHIP LINK */}
          <div>
            <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wide flex justify-between">
              <span>Merchant Link (Payhip)</span>
              {errors.payhip && <span className="text-alert-red font-bold animate-pulse">INVALID DOMAIN</span>}
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={form.payhip}
                onChange={(e) => handleChange('payhip', e.target.value)}
                className={`w-full bg-black border text-slate-300 p-2 pl-8 text-xs focus:outline-none transition-all ${
                  errors.payhip 
                    ? 'border-alert-red focus:border-alert-red text-alert-red' 
                    : 'border-slate-700 focus:border-amber-500'
                }`}
                placeholder="https://payhip.com/b/..."
              />
              <span className="absolute left-2 top-2 text-slate-600">🛒</span>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="bg-slate-900/30 p-4 border-t border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 text-slate-500 text-xs font-bold uppercase hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isLoading || hasErrors}
            className={`
              px-6 py-2 border text-xs font-bold uppercase flex items-center gap-2 transition-all
              ${isLoading || hasErrors 
                ? 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed' 
                : 'border-matrix-green bg-matrix-green/10 text-matrix-green hover:bg-matrix-green hover:text-black shadow-[0_0_15px_rgba(0,255,65,0.2)]'
              }
            `}
          >
            {isLoading ? (
               <>
                 <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin"></span>
                 WRITING...
               </>
            ) : (
               'SAVE MANIFEST'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}