
import React, { useState, useMemo } from 'react';
import { 
  DecorationPayload, PricingResult, CartItem 
} from './types';
import { MOCK_PRODUCTS, SHOP_DEFAULTS } from './mockData';
import { calculateUnitPrice, runCartOrchestrator } from './apexSimulator';
import { 
  Terminal, ShieldCheck, Database, 
  Play, RefreshCw, Trash2, EyeOff, Info, Search
} from 'lucide-react';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<PricingResult | null>(null);

  // Simulation Payload
  const [payload, setPayload] = useState<DecorationPayload>({
    sku: "TMX-1400CT-020-Grey",
    designId: 1320136,
    designData: [
      {
        viewName: "FRONT",
        viewCode: "FRONT",
        decorationCode: "3DEMBROIDERY",
        image: [{ src: "...", stitchCount: 5000, numberOfColors: 2 }],
        text: []
      },
      {
        viewName: "BACK",
        viewCode: "BACK",
        decorationCode: "FlatEmbroidery",
        image: [{ src: "...", stitchCount: 2000, numberOfColors: 1 }],
        text: []
      }
    ]
  });

  const handleSimulateAddToCart = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1200));

    try {
      const result = calculateUnitPrice(payload, 24);
      setLastResult(result);

      const newItem: CartItem = {
        Id: `ci_${Date.now()}`,
        Product2Id: result.product2Id,
        Quantity: result.quantity,
        UnitPrice: result.baseUnitPrice,
        ComputedUnitPrice__c: result.computedUnitPrice,
        PricingFingerprint__c: result.pricingFingerprint,
        TotalLineAmount: 0
      };

      const updatedCart = runCartOrchestrator([...cartItems, newItem]);
      setCartItems(updatedCart);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header - System Focus */}
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30 text-blue-400">
              <EyeOff size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center space-x-2">
                <span>Decorations Pricing Engine</span>
                <span className="bg-slate-800 text-slate-400 text-[10px] uppercase px-2 py-0.5 rounded tracking-widest font-mono">Invisible Headless LWC</span>
              </h1>
              <p className="text-slate-500 text-sm">Automated logic monitoring console for Commerce Add-to-Cart flows.</p>
            </div>
          </div>
          <button 
            onClick={handleSimulateAddToCart}
            disabled={isProcessing}
            className="group flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-900/20"
          >
            {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
            <span>Trigger Simulation</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Configuration & Logic Trace */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Input Toggle Simulation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
                <Search size={16} />
                <span>Payload Configuration</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase">Front Decoration</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    value={payload.designData[0].decorationCode}
                    onChange={(e) => {
                      const newData = [...payload.designData];
                      newData[0].decorationCode = e.target.value;
                      setPayload({...payload, designData: newData});
                    }}
                  >
                    <option value="3DEMBROIDERY">3D Embroidery (Override)</option>
                    <option value="FLATEMBROIDERY">Flat Embroidery (Base PBE)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase">Back View Decoration</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    value={payload.designData[1].image.length ? payload.designData[1].decorationCode : 'NONE'}
                    onChange={(e) => {
                      const newData = [...payload.designData];
                      if (e.target.value === 'NONE') {
                        newData[1].image = [];
                      } else {
                        newData[1].image = [{ src: "...", stitchCount: 1, numberOfColors: 1 }];
                        newData[1].decorationCode = e.target.value;
                      }
                      setPayload({...payload, designData: newData});
                    }}
                  >
                    <option value="NONE">No Decoration ($0.00)</option>
                    <option value="FLATEMBROIDERY">Flat Embroidery (+$5.00)</option>
                    <option value="3DEMBROIDERY">3D Embroidery (+$9.50)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="bg-black border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Terminal size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Pricing Execution Trace</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="p-6 font-mono text-xs space-y-2 h-[320px] overflow-y-auto">
                {lastResult ? (
                  lastResult.logs.map((log, i) => (
                    <div key={i} className="flex space-x-3 opacity-0 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}>
                      <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                      <span className={log.includes('Override') || log.includes('Adding PBE Price') ? 'text-blue-400 font-bold' : 'text-slate-300'}>
                        {log}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-700 italic">Waiting for simulation trigger...</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: State & DB View */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Metadata Reference */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
                <ShieldCheck size={16} className="text-blue-400" />
                <span>System Metadata</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-500">MDT Record</span>
                  <span className="font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded">Shop_Defaults</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Auth Price Book</span>
                  <span className="font-mono text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-800">{SHOP_DEFAULTS.Authenticated_Price_Book_ID__c}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Flat Deco ProductCode</span>
                  <span className="font-mono text-slate-400">{SHOP_DEFAULTS.Flat_Embroidery_Product_Code__c}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">3D Deco ProductCode</span>
                  <span className="font-mono text-slate-400">{SHOP_DEFAULTS.ThreeD_Embroidery_Product_Code__c}</span>
                </div>
              </div>
            </div>

            {/* Cart State DB */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                  <Database size={16} className="text-purple-400" />
                  <span>Mock Database State</span>
                </h3>
                <span className="text-[10px] text-slate-600 font-mono">Object: CartItem</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-800 text-slate-500 uppercase font-bold">
                      <th className="p-3">Computed__c</th>
                      <th className="p-3">Fingerprint</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(item => (
                      <tr key={item.Id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-emerald-400">${item.ComputedUnitPrice__c.toFixed(2)}</td>
                        <td className="p-3 font-mono text-slate-500">{item.PricingFingerprint__c}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => setCartItems(cartItems.filter(i => i.Id !== item.Id))} className="text-slate-700 hover:text-red-500 p-1">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cartItems.length === 0 && (
                      <tr><td colSpan={3} className="p-8 text-center text-slate-700 italic">No records in cart state.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Architectural Note */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                <Info size={16} />
                <span>Architecture Note</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                In production, the <strong>CartDecorationsOrchestrator</strong> extension is registered to <code>Commerce_Domain_Cart_Calculate</code>. It reads the <code>ComputedUnitPrice__c</code> and forces the platform to respect the unit value.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
