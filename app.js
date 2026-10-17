'use strict';

const API_URL = 'https://SEU-BACKEND.onrender.com';

function esc(t){if(t==null)return'';return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

function formatPrice(v,c='BRL'){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:c,minimumFractionDigits:2}).format(Number(v)||0);}

function discountPercent(i){if(!i.sale_price||!i.price||i.sale_price>=i.price)return null;return Math.round(((i.price-i.sale_price)/i.price)*100);}

async function apiFetch(path, opts={}){
  const r = await fetch(API_URL + path, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) }, ...opts });
  return r;
}

async function loadCategories(containerId, limit){
  const el=document.getElementById(containerId); if(!el)return;
  let cats=[];
  try{
    const r=await apiFetch('/api/categorias');
    const j=await r.json();
    cats=j.categorias||[];
  }catch(e){cats=[];}
  if(!cats.length)cats=[];
  el.innerHTML='';
  cats.slice(0,limit).forEach(c=>{
    const a=document.createElement('a');
    a.href='categoria.html?id='+esc(c.id)+'&nome='+esc(c.name);
    a.className='category-card';
    a.innerHTML=(c.picture?`<div class="category-img-wrap"><img src="${esc(c.picture)}" alt="${esc(c.name)}" loading="lazy"></div>`:`<div class="category-img-wrap category-img-placeholder">?</div>`)+
                `<span class="category-name">${esc(c.name)}</span><span class="category-count">${Number(c.total_items||0).toLocaleString('pt-BR')} itens</span>`;
    el.appendChild(a);
  });
}

async function loadSearch(q){
  const grid=document.getElementById('productsGrid'); const info=document.getElementById('pageInfo'); if(!grid)return;
  let items=[];
  try{
    const r=await apiFetch('/api/search?q='+encodeURIComponent(q));
    const j=await r.json(); items=j.items||[];
  }catch(e){items=[];}
  renderProdutos(grid,items);
  if(info)info.textContent='Pagina 1 de 1  |  '+(items.length)+' itens';
}

async function loadCategory(catId){
  const grid=document.getElementById('productsGridCat'); const info=document.getElementById('catPageInfo'); if(!grid)return;
  let items=[]; let catNome=catId;
  try{
    const r=await apiFetch('/api/categoria/'+catId);
    const j=await r.json(); items=j.items||[]; catNome=j.categoria?.name||catId;
  }catch(e){items=[];}
  document.getElementById('catTitulo').textContent=catNome;
  document.getElementById('catSubtitulo').textContent='Melhores ofertas ordenadas por preco (menor primeiro)';
  renderProdutos(grid,items,true);
  if(info)info.textContent='Pagina 1 de 1  |  '+(items.length)+' itens';
}

function renderProdutos(grid,items,isCat=false){
  grid.innerHTML='';
  items.forEach(it=>{
    const disc=discountPercent(it);
    const article=document.createElement('article');
    article.className='product-card';
    article.innerHTML=`
      <div class="product-thumb"><a href="#" class="thumb-link">
        ${it.thumbnail?`<img src="${esc(it.thumbnail)}" alt="${esc(it.title)}" loading="lazy">`:`<div class="thumb-placeholder">?</div>`}
      </a>${disc?`<span class="badge discount">-${disc}%</span>`:''}</div>
      <div class="product-info">
        <h3 class="product-title"><a href="${esc(it.permalink)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h3>
        <p class="product-price"><strong>${formatPrice(it.sale_price!=null?it.sale_price:it.price,it.currency_id)}</strong></p>
        ${it.sale_price&&it.price>it.sale_price?`<p class="product-price-old"><small>${formatPrice(it.price,it.currency_id)}</small></p>`:''}
        <p class="product-meta">${esc(it.condition||'Novo')} | ${esc(it.shipping.free_shipping?'Frete gratis':'Frete a pagar')}</p>
        <div class="product-actions">
          <a href="${esc(it.permalink)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">Ver oferta</a>
        </div>
      </div>`;
    grid.appendChild(article);
  });
}

async function checkAPI(){
  const el=document.getElementById('apiStatus'); if(!el)return;
  try{
    const r=await apiFetch('/api/categorias');
    el.textContent=r.ok?'API do Mercado Livre: online':'API indisponivel';
    el.className='api-status '+ (r.ok?'flash-success':'flash-error');
  }catch(e){
    el.textContent='Backend indisponivel. Configure a URL do Render no app.js';
    el.className='api-status flash-error';
  }
}

function setupSort(formId){
  const form=document.getElementById(formId); if(!form)return;
  const input=form.querySelector('input[name="sort"]');
  const btns=form.querySelectorAll('button[type="button"]');
  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      btns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      input.value=btn.dataset.sort;
      form.requestSubmit();
    });
  });
}
setupSort('sortForm');
setupSort('sortFormCat');
