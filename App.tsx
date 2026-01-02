
import React, { useState, useMemo, useEffect } from 'react';
import { 
  DecorationPayload, PricingResult, CartItem, Product2 
} from './types';
// Fix: Added MOCK_DECORATION_RULES to imports to satisfy its usage in the debug console
import { MOCK_PRODUCTS, MOCK_DECORATION_RULES } from './mockData';
import { calculateUnitPrice, runCartOrchestrator } from './apexSimulator';
import { ShoppingCart, Package, Info, CheckCircle, Code, Settings, Trash2 } from 'lucide-react';

export default function App() {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'product' | 'cart' | 'admin'>('product');
  const [selectedSku, setSelectedSku] = useState(MOCK_PRODUCTS[0].ProductCode);
  const [quantity, setQuantity] = useState(12);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // --- "Database" State ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // --- Input JSON state (simulating what the 'Estimator' would send) ---
  const [jsonPayload, setJsonPayload] = useState<DecorationPayload>({
    sku: "TMX-1400CT-020-Grey",
    designId: 1320136,
    designData: [
      {
        viewName: "FRONT",
        viewCode: "FRONT",
        decorationCode: "3DEmbroidery",
        image: [
          {
            src: "https://picsum.photos/100/100?random=1",
            stitchCount: 5363,
            numberOfColors: 1
          }
        ],
        text: []
      },
      {
        viewName: "BACK",
        viewCode: "BACK",
        decorationCode: "FlatEmbroidery",
        image: [], // Rule: Skip if no image
        text: [
          {
            text: "caps direct",
            fontSize: "40",
            stitchCount: 1896,
            numberOfColors: 1
          }
        ]
      },
      { viewName: "LEFT", viewCode: "LEFT", image: [], text: [], decorationCode: "FlatEmbroidery" },
      { viewName: "RIGHT", viewCode: "RIGHT", image: [], text: [], decorationCode: "FlatEmbroidery" }
    ]
  });

  // Sync SKU if user switches it in the dropdown
  useEffect(() => {
    setJsonPayload(prev => ({ ...prev, sku: selectedSku }));
  }, [selectedSku]);

  // Real-time pricing preview
  const pricingResultPreview = useMemo(() => {
    try {
      return calculateUnitPrice(jsonPayload, quantity);
    } catch (e) {
      return null;
    }
  }, [jsonPayload, quantity]);

  const handleAddToCart = async () => {
    setIsAdding(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    try {
      // 1) Apex Calculation
      const result = calculateUnitPrice(jsonPayload, quantity);

      // 2) Add Item (Storefront API simulation)
      const newItem: CartItem = {
        Id: `ci_${Date.now()}`,
        Product2Id: result.product2Id,
        Quantity: quantity,
        UnitPrice: result.baseUnitPrice, // Initially just the base price
        ComputedUnitPrice__c: result.computedUnitPrice,
        DecorationUnitAdj__c: result.perUnitDecorationTotal,
        AllocatedSetupPerUnit__c: result.allocatedSetupPerUnit,
        PricingFingerprint__c: result.pricingFingerprint,
        TotalLineAmount: result.baseUnitPrice * quantity
      };

      // 3) Recalculate Cart (Orchestrator simulation)
      const updatedCart = runCartOrchestrator([...cartItems, newItem]);
      setCartItems(updatedCart);

      setToast({ message: 'Product added with custom pricing!', type: 'success' });
      setActiveTab('cart');
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsAdding(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.Id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Package size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Commerce Estimator <span className="text-blue-600">Pro</span></h1>
          </div>
          <nav className="flex space-x-1 p-1 bg-slate-100 rounded-lg">
            {(['product', 'cart', 'admin'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'product' && 'Simulation View'}
                {tab === 'cart' && `View Cart (${cartItems.length})`}
                {tab === 'admin' && 'Debug Console'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-bounce z-[60] ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'product' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Product & Configurator */}
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold">1. Configure Design (JSON Input)</h2>
                  <div className="flex items-center space-x-2 text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                    <Code size={14} />
                    <span>LWC: decorationsAddToCart</span>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Product SKU</label>
                      <select 
                        value={selectedSku} 
                        onChange={(e) => setSelectedSku(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      >
                        {MOCK_PRODUCTS.map(p => <option key={p.Id} value={p.ProductCode}>{p.Name} ({p.ProductCode})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity Tier</label>
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700">Views & Decorations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jsonPayload.designData.map((view, idx) => (
                        <div key={view.viewCode} className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white hover:shadow-md transition-all cursor-default">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">{view.viewCode}</span>
                            <div className="flex items-center space-x-1 text-xs text-slate-400">
                              <Settings size={12} />
                              <span>{view.decorationCode}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {view.image.length > 0 ? (
                                <img src={view.image[0].src} className="object-cover w-full h-full" alt="Preview" />
                              ) : (
                                <span className="text-[10px] text-slate-400">Empty</span>
                              )}
                            </div>
                            <div className="flex-1">
                              {view.image.length > 0 ? (
                                <div className="text-xs space-y-0.5">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Stitches</span>
                                    <span className="font-bold text-blue-600">{view.image[0].stitchCount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Colors</span>
                                    <span className="font-bold text-blue-600">{view.image[0].numberOfColors}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-slate-400 text-xs italic">
                                  <Info size={12} />
                                  <span>Not priced (no image)</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Simulation Toggle for images */}
                          <button 
                            onClick={() => {
                              const newData = [...jsonPayload.designData];
                              if (newData[idx].image.length > 0) {
                                newData[idx].image = [];
                              } else {
                                newData[idx].image = [{ src: `https://picsum.photos/100/100?random=${idx+10}`, stitchCount: 4500, numberOfColors: 3 }];
                              }
                              setJsonPayload({...jsonPayload, designData: newData});
                            }}
                            className="mt-3 w-full text-[10px] font-bold text-blue-600 hover:bg-blue-50 py-1 rounded transition-colors"
                          >
                            {view.image.length > 0 ? 'Remove Image (Disable Pricing)' : 'Add Image (Enable Pricing)'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Logic Walkthrough */}
              <section className="bg-slate-900 rounded-2xl p-6 text-slate-300 font-mono text-sm leading-relaxed overflow-x-auto">
                <div className="flex items-center space-x-2 text-blue-400 mb-4 border-b border-slate-700 pb-2">
                  <Code size={16} />
                  <span className="font-bold uppercase tracking-widest text-xs">Architectural Logic Flow</span>
                </div>
                <div className="space-y-3">
                  <p><span className="text-emerald-400 font-bold">STEP 1:</span> LWC catches 'Add to Cart' and calls <span className="text-blue-400">EstimatorPricingService</span>.</p>
                  <p><span className="text-emerald-400 font-bold">STEP 2:</span> Apex parses JSON, filters views where <span className="text-yellow-400">image.length &gt; 0</span>.</p>
                  <p><span className="text-emerald-400 font-bold">STEP 3:</span> Pricing rules lookup based on <span className="text-yellow-400">{selectedSku}</span> and <span className="text-yellow-400">Qty: {quantity}</span>.</p>
                  <p><span className="text-emerald-400 font-bold">STEP 4:</span> Return <span className="text-blue-400">PricingResult</span> with computed Unit Price.</p>
                  <p><span className="text-emerald-400 font-bold">STEP 5:</span> Add Item to Cart and run <span className="text-purple-400">CartCalculate Orchestrator</span> to force platform price consistency.</p>
                </div>
              </section>
            </div>

            {/* Right: Pricing Sidebar & Checkout */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white rounded-2xl shadow-xl border border-slate-200 sticky top-24 overflow-hidden">
                <div className="p-6 bg-slate-900 text-white">
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <ShoppingCart size={20} />
                    <span>Real-time Quote</span>
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {pricingResultPreview ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Base Unit Price</span>
                          <span className="font-medium">${pricingResultPreview.baseUnitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Decoration Adjustments</span>
                          <span className="font-medium text-emerald-600">+ ${pricingResultPreview.perUnitDecorationTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-3 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">Allocated Setup Fees</span>
                          <span className="font-medium text-blue-600">+ ${pricingResultPreview.allocatedSetupPerUnit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1">
                          <span className="text-slate-900 font-bold">Final Unit Price</span>
                          <span className="text-2xl font-black text-slate-900">${pricingResultPreview.computedUnitPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <div className="flex justify-between font-bold text-blue-900 mb-1">
                          <span>Subtotal ({quantity} units)</span>
                          <span>${(pricingResultPreview.computedUnitPrice * quantity).toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-blue-600 italic">No tax/shipping applied in this organization.</p>
                      </div>

                      <button 
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all active:scale-95 flex items-center justify-center space-x-3 ${
                          isAdding ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-200'
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={20} />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <Info className="mx-auto text-slate-300" size={48} />
                      <p className="text-slate-500 text-sm">Invalid configuration.<br/>Please check your SKU or Quantity.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Fingerprint Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Fingerprint</span>
                </div>
                <code className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-blue-600 font-bold">
                  {pricingResultPreview?.pricingFingerprint || 'PENDING'}
                </code>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold">Your Active Shopping Cart</h2>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{cartItems.length} Items</span>
            </div>

            {cartItems.length > 0 ? (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.Id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Package size={32} className="text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{MOCK_PRODUCTS.find(p => p.Id === item.Product2Id)?.Name}</h3>
                        <p className="text-xs text-slate-500 font-mono">ID: {item.Id}</p>
                        <div className="flex items-center space-x-4 pt-2">
                          <div className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded flex items-center space-x-2">
                            <span className="text-slate-400">Qty:</span>
                            <span className="font-bold">{item.Quantity}</span>
                          </div>
                          <div className="text-xs bg-emerald-50 border border-emerald-100 px-2 py-1 rounded flex items-center space-x-2">
                            <span className="text-emerald-400 uppercase font-black text-[8px]">Decorated</span>
                            <span className="font-bold text-emerald-600">${item.UnitPrice.toFixed(2)} / unit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-black text-slate-900">${item.TotalLineAmount.toFixed(2)}</div>
                      <button 
                        onClick={() => removeFromCart(item.Id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="bg-slate-900 text-white rounded-2xl p-8 flex justify-between items-center shadow-2xl">
                  <div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Estimated Total</h3>
                    <p className="text-xs text-slate-500 italic">Orchestrator has enforced custom line pricing.</p>
                  </div>
                  <div className="text-4xl font-black">
                    ${cartItems.reduce((acc, i) => acc + i.TotalLineAmount, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
                <ShoppingCart size={64} className="mx-auto text-slate-200" />
                <p className="text-slate-500 font-medium">Your cart is currently empty.</p>
                <button onClick={() => setActiveTab('product')} className="text-blue-600 font-bold hover:underline">Return to Product Page</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-8 max-w-5xl mx-auto animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Code size={24} className="text-blue-600" />
              <span>Developer Debug Console</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-xs uppercase text-slate-500 tracking-wider">Decoration Rules Object (Mock DB)</div>
                <div className="p-4 overflow-auto max-h-[500px]">
                  <pre className="text-[10px] leading-tight text-slate-700">
                    {JSON.stringify({ MOCK_DECORATION_RULES }, null, 2)}
                  </pre>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-xs uppercase text-slate-500 tracking-wider">Raw Input JSON (Simulation Context)</div>
                <div className="p-4 overflow-auto max-h-[500px]">
                  <pre className="text-[10px] leading-tight text-slate-700">
                    {JSON.stringify(jsonPayload, null, 2)}
                  </pre>
                </div>
              </section>
            </div>

            <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-4 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider">Persisted Cart State (SOQL Mock)</div>
                <div className="p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                        <th className="pb-2">Id</th>
                        <th className="pb-2">Unit Price</th>
                        <th className="pb-2">Computed__c</th>
                        <th className="pb-2">DecoAdj__c</th>
                        <th className="pb-2">Setup__c</th>
                        <th className="pb-2">Fingerprint__c</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map(item => (
                        <tr key={item.Id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-mono text-blue-600 font-bold">{item.Id}</td>
                          <td className="py-3 font-bold">${item.UnitPrice.toFixed(2)}</td>
                          <td className="py-3 text-emerald-600 font-medium">${item.ComputedUnitPrice__c.toFixed(2)}</td>
                          <td className="py-3 text-slate-500">${item.DecorationUnitAdj__c.toFixed(2)}</td>
                          <td className="py-3 text-slate-500">${item.AllocatedSetupPerUnit__c.toFixed(2)}</td>
                          <td className="py-3 text-[9px] font-mono text-slate-400">{item.PricingFingerprint__c}</td>
                        </tr>
                      ))}
                      {cartItems.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">No records in the simulated database.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
          </div>
        )}
      </main>
    </div>
  );
}
