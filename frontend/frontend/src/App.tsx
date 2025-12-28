import { useEffect, useState, type FormEvent, useRef, type KeyboardEvent } from 'react';
import axios from 'axios';

// --- TIPOS ---
interface Product { id: number; name: string; sku: string; salePrice: string; stock: number; minStock: number; }
interface CartItem extends Product { cartId: string; sellQuantity: number; subtotal: number; }

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // CAIXA
  const [search, setSearch] = useState('');
  const [filteredList, setFilteredList] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [currentQty, setCurrentQty] = useState<number>(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // CARRINHO
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);

  // CADASTRO
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newMinStock, setNewMinStock] = useState('5');

  async function loadProducts() {
    try { const res = await axios.get('http://localhost:3001/products'); setProducts(res.data); } catch (error) { console.error(error); }
  }
  useEffect(() => { loadProducts(); }, []);

  // --- BUSCA ---
  useEffect(() => {
    if (!search || foundProduct) { setFilteredList([]); setShowDropdown(false); return; }
    const terms = search.toLowerCase();
    const matches = products.filter(p => p.sku.toLowerCase().includes(terms) || p.name.toLowerCase().includes(terms));
    const exactMatch = matches.find(p => p.sku.toLowerCase() === terms);
    if (exactMatch) { selectProduct(exactMatch); } else { setFilteredList(matches); setShowDropdown(matches.length > 0); }
  }, [search, products]);

  function selectProduct(product: Product) {
    setFoundProduct(product); setSearch(product.name); setShowDropdown(false); setCurrentQty(1);
  }

  // --- CARRINHO ---
  function addToCart() {
    if (!foundProduct) return;
    if (currentQty <= 0) return alert("Qtd inválida");
    if (currentQty > foundProduct.stock) return alert("Estoque insuficiente!");
    const newItem: CartItem = { ...foundProduct, cartId: crypto.randomUUID(), sellQuantity: currentQty, subtotal: parseFloat(foundProduct.salePrice) * currentQty };
    setCart([...cart, newItem]); setFoundProduct(null); setSearch(''); setCurrentQty(1); searchInputRef.current?.focus();
  }
  function removeFromCart(idToRemove: string) { setCart(cart.filter(item => item.cartId !== idToRemove)); }
  const totalCartValue = cart.reduce((acc, item) => acc + item.subtotal, 0);

  useEffect(() => { const paid = parseFloat(amountPaid.replace(',', '.')) || 0; setChange(paid - totalCartValue); }, [amountPaid, totalCartValue]);

  async function finalizeOrder() {
    if (cart.length === 0) return alert("Carrinho vazio!");
    if (change < 0 && !confirm("Valor menor. Confirmar?")) return;
    try {
      for (const item of cart) { await axios.post(`http://localhost:3001/products/${item.id}/sell`, { amount: item.sellQuantity }); }
      alert("✅ Venda Realizada!"); loadProducts(); setCart([]); setAmountPaid(''); setChange(0); searchInputRef.current?.focus();
    } catch (error) { alert("Erro ao vender."); }
  }

  // --- FUNÇÕES DE SISTEMA ---
  async function handleExit() {
    if (confirm("Deseja fechar o sistema completamente?")) {
      try {
        await axios.post('http://localhost:3001/shutdown');
        window.close(); // Tenta fechar a aba
        document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:50px; font-family:sans-serif'><h1>Sistema Encerrado.</h1><p>Pode fechar esta janela.</p></div>";
      } catch (error) {
        alert("Erro ao desligar. Feche a janela manualmente.");
      }
    }
  }

  // --- GESTÃO ---
  async function handleSave(e: FormEvent) {
    e.preventDefault(); if (!newName) return alert("Preencha tudo!");
    await axios.post('http://localhost:3001/products', { name: newName, sku: newSku, costPrice: 0, salePrice: parseFloat(newPrice), stock: parseInt(newStock) || 0, minStock: parseInt(newMinStock) || 5 });
    setNewName(''); setNewSku(''); setNewPrice(''); setNewStock(''); setNewMinStock('5'); setShowRegister(false); loadProducts(); alert("Salvo!");
  }
  async function handleDirectUpdate(id: number, val: string) {
    const stock = parseInt(val); if (!isNaN(stock) && stock >= 0) { await axios.put(`http://localhost:3001/products/${id}`, { stock }); loadProducts(); }
  }
  const handleKeyDownStock = (e: KeyboardEvent<HTMLInputElement>, id: number) => { if (e.key === 'Enter') { handleDirectUpdate(id, e.currentTarget.value); e.currentTarget.blur(); } };
  async function handleDelete(id: number) { if (confirm("Apagar?")) { await axios.delete(`http://localhost:3001/products/${id}`); loadProducts(); } }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#0f172a', color: '#f8fafc', fontFamily: 'Segoe UI, sans-serif', overflow: 'hidden' }}>
      
      {/* LADO ESQUERDO */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={{ fontSize: '32px', color: '#4ade80', margin: 0, fontWeight: '800' }}>🛒 SUPER CAIXA</h1>
            <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>{showSidebar ? 'Ocultar Estoque' : 'Ver Estoque'}</button>
          </div>
          {/* BOTÃO SAIR */}
          <button onClick={handleExit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 SAIR</button>
        </div>

        <div style={{ position: 'relative', marginBottom: '30px' }}>
          <input ref={searchInputRef} placeholder="🔎 Digite o nome ou bipe o código..." value={search} onChange={e => setSearch(e.target.value)} disabled={!!foundProduct} style={{ width: '100%', boxSizing: 'border-box', padding: '25px', fontSize: '24px', background: foundProduct ? '#020617' : '#1e293b', border: '2px solid #334155', color: 'white', borderRadius: '12px', outline: 'none' }} />
           {showDropdown && !foundProduct && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid #334155', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              {filteredList.map(item => (
                <div key={item.id} onClick={() => selectProduct(item)} style={{ padding: '15px', borderBottom: '1px solid #334155', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}><span>{item.name}</span><span style={{ color: '#4ade80', fontWeight: 'bold' }}>R$ {item.salePrice}</span></div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {foundProduct ? (
            <div style={{ background: '#1e293b', padding: '40px', borderRadius: '20px', border: '1px solid #334155', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'fadeIn 0.3s' }}>
              <h2 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#fff' }}>{foundProduct.name}</h2>
              <div style={{ fontSize: '32px', color: '#4ade80', marginBottom: '30px', fontWeight: 'bold' }}>R$ {foundProduct.salePrice}</div>
              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-end', marginBottom: '30px' }}>
                <div style={{ flex: 1 }}><label style={{ display: 'block', color: '#94a3b8', marginBottom: '10px' }}>QUANTIDADE</label><input type="number" min="1" autoFocus value={currentQty} onChange={e => setCurrentQty(parseInt(e.target.value) || 0)} onKeyDown={e => e.key === 'Enter' && addToCart()} style={giantInput} /></div>
                <div style={{ flex: 1 }}><label style={{ display: 'block', color: '#94a3b8', marginBottom: '10px' }}>SUBTOTAL</label><div style={{ padding: '20px', fontSize: '32px', background: '#0f172a', border: '2px solid #334155', color: '#4ade80', borderRadius: '12px', textAlign: 'center' }}>R$ {(parseFloat(foundProduct.salePrice) * currentQty).toFixed(2)}</div></div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}><button onClick={() => { setFoundProduct(null); setSearch(''); searchInputRef.current?.focus(); }} style={{ flex: 1, padding: '20px', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>CANCELAR</button><button onClick={addToCart} style={{ flex: 2, padding: '20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>ADICIONAR AO CARRINHO ↵</button></div>
            </div>
          ) : ( <div style={{ textAlign: 'center', opacity: 0.2 }}><div style={{ fontSize: '120px' }}>🛍️</div><h2>Passe o produto...</h2></div> )}
        </div>
        <button onClick={() => setShowRegister(true)} style={{ marginTop: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', alignSelf: 'start', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px', color: '#2563eb' }}>+</span> Novo Produto</button>
      </div>

      {/* LADO DIREITO */}
      <div style={{ width: '35%', background: '#020617', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #334155' }}>
        <div style={{ padding: '25px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '24px' }}>🧾</span><h2 style={{ margin: 0, fontSize: '22px', color: '#e2e8f0', fontWeight: 'bold' }}>LISTA DA COMPRA</h2></div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {cart.length === 0 ? ( <div style={{ textAlign: 'center', color: '#64748b', marginTop: '100px', fontSize: '18px' }}>Carrinho vazio</div> ) : ( cart.map(item => ( <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#1e293b', marginBottom: '10px', borderRadius: '10px', borderLeft: '5px solid #2563eb' }}><div><div style={{ fontWeight: 'bold', fontSize: '18px' }}>{item.name}</div><div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '5px' }}>{item.sellQuantity} x R$ {item.salePrice}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontWeight: 'bold', color: '#fff', fontSize: '18px' }}>R$ {item.subtotal.toFixed(2)}</div><button onClick={() => removeFromCart(item.cartId)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', marginTop: '5px', textDecoration: 'underline' }}>Remover</button></div></div> )) )}
        </div>
        <div style={{ padding: '30px', background: '#0f172a', borderTop: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '20px' }}><span>TOTAL GERAL:</span><span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '28px' }}>R$ {totalCartValue.toFixed(2)}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}><span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 'bold' }}>PAGO:</span><input type="number" placeholder="R$ 0.00" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ flex: 1, padding: '15px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '20px' }} /></div>
          {amountPaid && ( <div style={{ textAlign: 'center', padding: '15px', background: change < 0 ? '#450a0a' : '#064e3b', borderRadius: '8px', marginBottom: '20px', color: change < 0 ? '#fca5a5' : '#86efac', fontWeight: 'bold', fontSize: '18px', border: change < 0 ? '1px solid #ef4444' : '1px solid #22c55e' }}>{change < 0 ? `FALTA: R$ ${Math.abs(change).toFixed(2)}` : `TROCO: R$ ${change.toFixed(2)}`}</div> )}
          <button onClick={finalizeOrder} disabled={cart.length === 0} style={{ width: '100%', padding: '20px', background: cart.length > 0 ? '#16a34a' : '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '22px', cursor: cart.length > 0 ? 'pointer' : 'not-allowed', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>✅ FINALIZAR VENDA</button>
        </div>
      </div>

      {showRegister && ( <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}><div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid #334155', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '24px', color: 'white' }}>Novo Produto</h2><button onClick={() => setShowRegister(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>&times;</button></div><form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}><div><label style={labelStyle}>Nome do Produto</label><input placeholder="Ex: Camiseta..." value={newName} onChange={e => setNewName(e.target.value)} style={modalInput} autoFocus /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}><div><label style={labelStyle}>SKU (Código)</label><input placeholder="Ex: CAM-001" value={newSku} onChange={e => setNewSku(e.target.value)} style={modalInput} /></div><div><label style={labelStyle}>Preço Venda</label><input type="number" placeholder="0.00" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={modalInput} /></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}><div><label style={labelStyle}>Estoque Inicial</label><input type="number" placeholder="0" value={newStock} onChange={e => setNewStock(e.target.value)} style={modalInput} /></div><div><label style={labelStyle}>Estoque Mínimo</label><input type="number" placeholder="5" value={newMinStock} onChange={e => setNewMinStock(e.target.value)} style={modalInput} /></div></div><div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button type="button" onClick={() => setShowRegister(false)} style={{ flex: 1, padding: '15px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button><button type="submit" style={{ flex: 2, padding: '15px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Produto</button></div></form></div></div> )}
      {showSidebar && ( <div style={{ position: 'absolute', top: 0, right: 0, height: '100vh', width: '400px', background: '#0f172a', borderLeft: '1px solid #334155', padding: '20px', overflowY: 'auto', zIndex: 200, boxShadow: '-10px 0 30px rgba(0,0,0,0.7)', animation: 'slideIn 0.3s' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ margin: 0 }}>📦 Estoque</h2><button onClick={() => setShowSidebar(false)} style={{ fontSize: '24px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button></div>{products.map(p => ( <div key={p.id} style={{ padding: '15px', borderBottom: '1px solid #1e293b', background: '#1e293b', marginBottom: '10px', borderRadius: '8px' }}><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{p.name}</div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}><span style={{ color: '#94a3b8' }}>{p.sku}</span><input type="number" defaultValue={p.stock} onKeyDown={e => handleKeyDownStock(e, p.id)} style={{ width: '60px', background: '#020617', border: '1px solid #334155', color: 'white', textAlign: 'center', borderRadius: '4px' }} /></div><button onClick={() => handleDelete(p.id)} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '12px', marginTop: '5px' }}>Excluir</button></div> ))}</div> )}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
const giantInput = { width: '100%', boxSizing: 'border-box' as const, padding: '20px', fontSize: '32px', background: '#0f172a', border: '2px solid #334155', color: 'white', borderRadius: '12px', textAlign: 'center' as const };
const modalInput = { width: '100%', boxSizing: 'border-box' as const, padding: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '6px', fontSize: '16px' };
const labelStyle = { display: 'block', color: '#94a3b8', marginBottom: '5px', fontSize: '14px' };
export default App;