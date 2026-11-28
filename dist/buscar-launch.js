'use strict';
const bar=document.querySelector('.mast .bar');
if(bar&&!document.querySelector('#global-search-link')){
 const link=document.createElement('a');link.id='global-search-link';link.className='global-search-link';link.href='/buscar.html';link.textContent='⌕ Buscar en Ally Lab';link.setAttribute('aria-label','Buscador universal');
 const target=document.getElementById('mast-quick-actions');
 if(target)target.prepend(link);else bar.append(link);
}
