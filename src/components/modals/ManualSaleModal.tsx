import React, { useState } from 'react';
import { Database } from '../../../database.types';
import { useTacticalActions } from '../../hooks/useTacticalActions';

type AssetRow = Database['public']['Tables']['assets']['Row'];

interface ManualSaleModalProps {
  asset: AssetRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualSaleModal({ asset, isOpen, onClose }: ManualSaleModalProps) {
  const { logManualTransaction, isLoading } = useTacticalActions();

  // === FORM STATE ===
  const [amount, setAmount] = useState<string>('20.00');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  const handleConfirm = async () => {
    if (!asset) return;
    
    // Convert date to ISO timestamp with current time
    const timestamp = new Date(date);
    const now = new Date();
    timestamp.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const result = await logManualTransaction({
      assetId: asset.id,
      amount: parseFloat(amount),
      occurredAt: timestamp.toISOString()
    });

    if (result.success) {
      onClose();
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-void-black border-2 border-matrix-green/50 shadow-[0_0_50px_rgba(0,255,65,0.1)] font-mono relative">
        
        {/* HEADER */}
        <div className="bg-matrix-green/10 border-b border-matrix-green/30 p-4 flex justify-between items-center">
          <h2 className="text-matrix-green font-bold tracking-widest uppercase flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-matrix-green animate-pulse"></span>
            MANUAL TRANSACTION
          </h2>
          <button 
            onClick={onClose}
            className="text-matrix-green/50 hover:text-white px-2"
          >
            [X]
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          
          {/* TARGET INFO */}
          <div className="text-xs text-center border border-dashed border-gray-700 p-2 text-gray-400">
            TARGET UNIT: <span className="text-white font-bold">{asset.sku_slug}</span>
          </div>

          {/* INPUT: AMOUNT */}
          <div>
            <label className="block text-[10px] text-matrix-green/70 mb-1 uppercase tracking-wide">
              REVENUE AMOUNT (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-matrix-green font-bold">$</span>
              <input 
                type="number" 
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black border border-matrix-green/30 text-white p-2 pl-7 font-bold text-lg focus:outline-none focus:border-matrix-green focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all"
              />
            </div>
          </div>

          {/* INPUT: DATE */}
          <div>
            <label className="block text-[10px] text-matrix-green/70 mb-1 uppercase tracking-wide">
              TRANSACTION DATE
            </label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black border border-matrix-green/30 text-gray-300 p-2 text-sm focus:outline-none focus:border-matrix-green"
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-matrix-green/20 bg-matrix-green/5 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 border border-matrix-green/30 text-matrix-green/60 text-xs font-bold uppercase hover:bg-matrix-green/10 transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isLoading || !amount}
            className={`
              flex-[2] py-3 text-xs font-bold uppercase tracking-widest transition-all
              ${isLoading 
                ? 'bg-gray-800 text-gray-500 cursor-wait' 
                : 'bg-matrix-green text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,65,0.6)]'
              }
            `}
          >
            {isLoading ? 'PROCESSING...' : 'CONFIRM REVENUE'}
          </button>
        </div>

      </div>
    </div>
  );
}