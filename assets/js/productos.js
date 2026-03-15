// ==============================
// CONFIGURACIÓN
// ==============================

const PRODUCTS_URL = 'data/productos.json'; // luego será una API
const PRODUCTS_PER_PAGE = 6;

// ==============================
// ESTADO
// ==============================

let allProducts = [];
let filteredProducts = [];
let currentFilter = 'all';
let currentPage = 1;
let expanded = false;


// ==============================
// ELEMENTOS DOM
// ==============================

const container = document.getElementById('products-container');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const filters = document.querySelectorAll('#portfolio-flters li');

// Lightbox
const lightbox = document.getElementById('custom-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');

// Modal
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalVideo = document.getElementById('modalVideo');
const modalDemo = document.getElementById('modalDemo');
const modalGithub = document.getElementById('modalGithub');

// ==============================
// INIT
// ==============================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Esperar a que supabaseClient esté disponible (cargado dinámicamente)
  const checkSupabase = setInterval(async () => {
    if (window.supabaseClient) {
      clearInterval(checkSupabase);
      await loadProducts();
      applyFilter('all');
      initFilters();
      initLoadMore();
      initLightbox();
      refreshIsotope(); // Nueva función para refrescar el layout
    }
  }, 100);
}

// Función para que Isotope reconozca los nuevos elementos dinámicos
function refreshIsotope() {
  const container = document.querySelector('.portfolio-container');
  if (container && window.jQuery && $.fn.isotope) {
      const $grid = $(container).isotope({
          itemSelector: '.portfolio-item',
          layoutMode: 'fitRows',
          transitionDuration: '0.4s'
      });
      
      $grid.isotope('reloadItems').isotope({ sortBy: 'original-order' });
      
      // Forzar relayout cuando las imágenes carguen
      $(container).find('img').on('load', function() {
          $grid.isotope('layout');
      });

      // Relayout de seguridad tras medio segundo
      setTimeout(() => $grid.isotope('layout'), 800);
  }
}

// Función para transformar links de YouTube normales a formato embed
function formatYoutubeUrl(url) {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;

    let videoId = '';
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// ==============================
// CARGA DE DATOS
// ==============================

async function loadProducts() {
  try {
    const { data: soft, error } = await supabaseClient
      .from('software_venta')
      .select('*')
      .eq('estado', 'Activo')
      .order('id', { ascending: false });

    if (error) throw error;

    // Mapeo de DB a UI con protecciones contra nulos
    allProducts = soft.map(s => ({
      id: s.id,
      titulo: s.nombre_sistema || 'Sin nombre',
      descripcion: (s.descripcion && s.descripcion !== 'null') ? s.descripcion : '',
      categoria: s.categoria || 'sistemas',
      imagen: (s.url_imagen && s.url_imagen !== 'null' && s.url_imagen !== '') ? s.url_imagen : 'assets/img/servicios/software-default.jpg',
      video: s.url_video || '',
      demo: s.url_demo || '',
      precio: s.precio_regular || 0
    }));

    if (allProducts.length === 0) {
        console.warn("Cargando productos desde JSON como fallback...");
        const res = await fetch(PRODUCTS_URL);
        allProducts = await res.json();
    }
  } catch (error) {
    console.error('Error cargando productos desde Supabase:', error);
    // Fallback opcional al JSON por si falla Supabase
    const res = await fetch(PRODUCTS_URL);
    allProducts = await res.json();
  }
}


// ==============================
// FILTROS
// ==============================

function initFilters() {
  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('filter-active'));
      filter.classList.add('filter-active');

      currentFilter = filter.dataset.filter;
      currentPage = 1;

      applyFilter(currentFilter);
    });
  });
}

function applyFilter(filter) {
  filteredProducts =
    filter === 'all'
      ? allProducts
      : allProducts.filter(p => p.categoria === filter);

  renderProducts();
  updateLoadMore();
}

// ==============================
// RENDER
// ==============================

function renderProducts() {
  container.innerHTML = '';

  const visibleProducts = expanded
    ? filteredProducts
    : filteredProducts.slice(0, PRODUCTS_PER_PAGE);

  visibleProducts.forEach(product => {
    container.appendChild(createProductCard(product));
  });
}


// ==============================
// CARD
// ==============================

function createProductCard(product) {
  const col = document.createElement('div');
  col.className = 'col-lg-4 col-md-6 col-12 portfolio-item';

  col.innerHTML = `
    <div class="portfolio-wrap">
      <figure>
        <img src="${product.imagen}" alt="${product.titulo}">
        
        <div class="portfolio-actions d-flex flex-column gap-2 px-3">
          <button class="btn-details w-100 rounded-pill fw-bold" title="Más información sobre el producto">
            <i class="fas fa-info-circle me-1"></i> Ver Info
          </button>
          <button class="btn-buy w-100 rounded-pill fw-bold" title="Adquirir este producto">
            <i class="fas fa-shopping-cart me-1"></i> Comprar / Alquilar
          </button>
        </div>
      </figure>

      <div class="portfolio-info">
        <h4>${product.titulo}</h4>
        <p>${product.descripcion}</p>
        <div class="fw-bold text-primary mt-2">S/ ${product.precio || '0.00'}</div>
      </div>
    </div>
  `;

  // Eventos
  const detailsBtn = col.querySelector('.btn-details');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => openModal(product));
  }

  const buyBtn = col.querySelector('.btn-buy');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
        if (window.Checkout) {
            window.Checkout.open({
                type: 'software',
                id: product.id,
                name: product.titulo,
                price: product.precio
            });
        }
    });
  }

  // Evento al clic de la imagen para abrir lightbox
  const img = col.querySelector('img');
  if (img) {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => openLightbox(product));
  }

  return col;
}

// ==============================
// VER MÁS
// ==============================

function initLoadMore() {
  loadMoreBtn.addEventListener('click', () => {
    expanded = !expanded;

    renderProducts();
    updateLoadMore();

    if (!expanded) {
      // vuelve suavemente arriba de productos
      document
        .getElementById('portfolio')
        .scrollIntoView({ behavior: 'smooth' });
    }
  });
}


function updateLoadMore() {
  if (filteredProducts.length > PRODUCTS_PER_PAGE) {
    loadMoreContainer.style.display = 'block';
    loadMoreBtn.textContent = expanded ? 'Ver menos' : 'Ver más';
  } else {
    loadMoreContainer.style.display = 'none';
  }
}


// ==============================
// LIGHTBOX
// ==============================

function initLightbox() {
  lightboxClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}

function openLightbox(product) {
  lightboxImg.src = product.imagen;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

// ==============================
// MODAL
// ==============================

function openModal(product) {
  modalTitle.textContent = product.titulo;
  modalDescription.textContent = product.descripcion;

  // Video
  modalVideo.src = formatYoutubeUrl(product.video);

  // GitHub
  modalGithub.href = product.github || '#';

  // Demo
  if (product.demo && product.demo.trim() !== '') {
    modalDemo.href = product.demo;
    modalDemo.style.display = 'inline-block';
  } else {
    modalDemo.style.display = 'none';
  }

  // Buy Button
  const modalBuy = document.getElementById('modalBuy');
  if (modalBuy) {
    // Limpiar eventos anteriores (clonando)
    const newBuyBtn = modalBuy.cloneNode(true);
    modalBuy.parentNode.replaceChild(newBuyBtn, modalBuy);
    
    newBuyBtn.addEventListener('click', () => {
        if (window.Checkout) {
            window.Checkout.open({
                type: 'software',
                id: product.id,
                name: product.titulo,
                price: product.price || product.precio
            });
            // Opcional: cerrar el modal de info
            const currentModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            if (currentModal) currentModal.hide();
        }
    });
  }

  const modal = new bootstrap.Modal(
    document.getElementById('productModal')
  );
  modal.show();
}


const productModalEl = document.getElementById('productModal');

productModalEl.addEventListener('hidden.bs.modal', () => {
  // Detiene el video (corta audio sí o sí)
  modalVideo.src = '';
});
