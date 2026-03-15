/* =========================================
   ADMIN DASHBOARD LOGIC (OCA Management System)
   ========================================= */

(async function() {
    console.log("Admin.js cargado e iniciando...");

    const contentArea = document.getElementById('adminContentArea');
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const adminSidebar = document.getElementById('adminSidebar');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : 'https://oca-backend.onrender.com/api';

    // 1. Verificar Sesión y Rol de Admin
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();

    const isSubfolder = window.location.pathname.includes('/admin/');
    const loginRedirect = isSubfolder ? "index.html" : "login.html";

    if (authError || !session) {
        window.location.href = loginRedirect;
        return;
    }

    const { data: userData } = await supabaseClient.from('usuarios').select('rol').eq('id', session.user.id).single();

    if (!userData || userData.rol !== 'admin') {
        console.warn("Usuario no autorizado para entrar al panel admin.");
        const profileRedirect = isSubfolder ? "../perfil.html" : "perfil.html";
        window.location.href = profileRedirect;
        return;
    }

    // 2. Control de Navegación entre Módulos
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            if (window.innerWidth < 992) adminSidebar.classList.remove('active');
            
            renderModule(tab);
        });
    });

    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            adminSidebar.classList.toggle('active');
        });
    }

    // 3. Renderizador de Módulos
    async function renderModule(moduleName) {
        contentArea.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;
        
        try {
            switch(moduleName) {
                case 'inicio': await renderInicio(); break;
                case 'clientes': await renderClientes(); break;
                case 'suscripciones': await renderSuscripciones(); break;
                case 'productos': await renderCatalogo(); break;
                case 'pedidos': await renderPedidos(); break;
                case 'planes': await renderPlanesWeb(); break;
                case 'soporte': await renderSoporte(); break;
                case 'whatsapp': await renderWhatsApp(); break;
                case 'leads': await renderLeads(); break;
                case 'opiniones': await renderOpiniones(); break;
                case 'marketing': await renderMarketing(); break;
                case 'estadisticas': await renderEstadisticas(); break;
                case 'configuracion': await renderConfiguracion(); break;
                default: await renderInicio();
            }
        } catch (err) {
            console.error(`Error cargando módulo ${moduleName}:`, err);
            contentArea.innerHTML = `<div class="alert alert-danger">Error al cargar el módulo ${moduleName}. Revisa la consola.</div>`;
        }
    }

    // ==========================================
    // MÓDULO 1: PANEL DE CONTROL INTELIGENTE (INICIO)
    // ==========================================
    async function renderInicio() {
        // Obtenemos data agregada
        const { count: totalClientes } = await supabaseClient.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'cliente');
        const { data: pagos } = await supabaseClient.from('pagos').select('monto');
        const { count: ticketsAbiertos } = await supabaseClient.from('tickets_soporte').select('*', { count: 'exact', head: true }).eq('estado', 'Abierto');
        const { count: subsActivas } = await supabaseClient.from('servicios_adquiridos').select('*', { count: 'exact', head: true }).eq('estado', 'Activo');
        
        const totalIngresos = pagos.reduce((acc, current) => acc + (parseFloat(current.monto) || 0), 0);

        contentArea.innerHTML = `
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="admin-card">
                        <div class="stat-label">INGRESOS TOTALES</div>
                        <div class="stat-val text-primary">$${totalIngresos.toFixed(2)}</div>
                        <div class="stat-delta delta-up"><i class="fas fa-caret-up"></i> +12% vs mes ant.</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="admin-card">
                        <div class="stat-label">CLIENTES (CRM)</div>
                        <div class="stat-val">${totalClientes || 0}</div>
                        <div class="stat-delta text-muted">Cartera activa</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="admin-card">
                        <div class="stat-label">SUSCRIPCIONES SaaS</div>
                        <div class="stat-val text-success">${subsActivas || 0}</div>
                        <div class="stat-delta text-success"><i class="fas fa-check"></i> Activas ahora</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="admin-card">
                        <div class="stat-label">SOPORTE TÉCNICO</div>
                        <div class="stat-val text-danger">${ticketsAbiertos || 0}</div>
                        <div class="stat-delta text-danger">Tickets abiertos</div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mt-3">
                <div class="col-xl-8">
                    <div class="admin-card">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h6 class="fw-bold m-0">Ventas y Crecimiento Mensual</h6>
                            <span class="badge bg-light text-dark">Ene - Jun 2024</span>
                        </div>
                        <div class="chart-container">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-xl-4">
                    <div class="admin-card">
                        <h6 class="fw-bold mb-4">Distribución de Servicios</h6>
                        <div class="chart-container">
                            <canvas id="servicesPie"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initCharts();
    }

    function initCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { 
                        color: '#64748b', 
                        font: { family: 'Plus Jakarta Sans', weight: '600', size: 12 } 
                    }
                }
            },
            scales: {
                y: { 
                    ticks: { color: '#64748b', font: { weight: '600' } }, 
                    grid: { color: '#f1f5f9' } 
                },
                x: { 
                    ticks: { color: '#64748b', font: { weight: '600' } }, 
                    grid: { display: false } 
                }
            }
        };

        const ctx = document.getElementById('revenueChart')?.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Ingresos ($)',
                        data: [1200, 1900, 1500, 2500, 2200, 3100],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: chartOptions
            });
        }

        const ctx2 = document.getElementById('servicesPie')?.getContext('2d');
        if (ctx2) {
            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Software', 'Web', 'Soporte'],
                    datasets: [{
                        data: [45, 35, 20],
                        backgroundColor: ['#6366f1', '#0ea5e9', '#f43f5e'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    ...chartOptions,
                    cutout: '70%',
                    scales: {} 
                }
            });
        }
    }

    // ==========================================
    // MÓDULO 2: GESTIÓN DE CLIENTES (CRM)
    // ==========================================
    async function renderClientes() {
        const { data: clientes } = await supabaseClient.from('usuarios').select('*, clientes(*)').eq('rol', 'cliente');
        
        contentArea.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold m-0">Gestión de Clientes (CRM)</h4>
                <button class="btn btn-primary btn-sm"><i class="fas fa-plus me-1"></i>Nuevo Cliente</button>
            </div>
            
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Empresa</th>
                            <th>WhatsApp</th>
                            <th>Email</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientes.map(c => `
                            <tr>
                                <td><div class="fw-bold">${c.nombre_completo}</div></td>
                                <td>${c.clientes?.[0]?.empresa || 'N/A'}</td>
                                <td><a href="https://wa.me/${c.clientes?.[0]?.telefono}" target="_blank" class="text-success"><i class="fab fa-whatsapp"></i> ${c.clientes?.[0]?.telefono || '--'}</a></td>
                                <td class="text-muted">${c.email}</td>
                                <td><span class="badge-status bg-light-success text-success">${c.clientes?.[0]?.estado_cliente || 'Activo'}</span></td>
                                <td>
                                    <button class="btn btn-sm text-primary"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm text-dark"><i class="fas fa-eye"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 12: CONFIGURACIÓN
    // ==========================================
    async function renderConfiguracion() {
        const { data: config } = await supabaseClient.from('configuracion_sistema').select('*').single();

        contentArea.innerHTML = `
            <h4 class="fw-bold mb-4">Configuración del Sistema</h4>
            <div class="row">
                <div class="col-md-8">
                    <div class="admin-card">
                        <form id="configForm">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Nombre de la Empresa</label>
                                    <input type="text" class="form-control" name="nombre_empresa" value="${config.nombre_empresa}">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">WhatsApp de Contacto</label>
                                    <input type="text" class="form-control" name="whatsapp_contacto" value="${config.whatsapp_contacto || ''}">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Email Corporativo</label>
                                    <input type="email" class="form-control" name="email_contacto" value="${config.email_contacto || ''}">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Métodos de Pago (Opciones)</label>
                                    <div class="d-flex gap-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="pay_bcp" ${config.metodos_pago.bcp ? 'checked' : ''}>
                                            <label class="form-check-label" for="pay_bcp">BCP / Transferencia</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="pay_yape" ${config.metodos_pago.yape ? 'checked' : ''}>
                                            <label class="form-check-label" for="pay_yape">Yape / Plin</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="pay_paypal" ${config.metodos_pago.paypal ? 'checked' : ''}>
                                            <label class="form-check-label" for="pay_paypal">PayPal</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr>
                            <button type="submit" class="btn btn-primary px-4">Guardar Configuración Global</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 4: GESTIÓN DE SUSCRIPCIONES (SaaS)
    // ==========================================
    async function renderSuscripciones() {
        const { data: subs } = await supabaseClient
            .from('servicios_adquiridos')
            .select('*, usuarios(nombre_completo), software_venta(nombre_sistema), planes_web(nombre_plan)');
        
        const hoy = new Date();
        const proxVencer = new Date();
        proxVencer.setDate(hoy.getDate() + 7);

        contentArea.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold m-0">Gestión de Suscripciones (SaaS)</h4>
            </div>
            
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Software / Plan</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subs.map(s => {
                            const fVence = s.proximo_vencimiento ? new Date(s.proximo_vencimiento) : null;
                            let badgeClass = 'bg-light-success text-success';
                            let estadoTxt = s.estado || 'Activo';

                            if (fVence && fVence < hoy) {
                                badgeClass = 'bg-light-danger text-danger';
                                estadoTxt = 'Vencido';
                            } else if (fVence && fVence <= proxVencer) {
                                badgeClass = 'bg-light-warning text-warning';
                                estadoTxt = 'Por Vencer';
                            }

                            return `
                                <tr>
                                    <td>${s.usuarios?.nombre_completo || 'Unknown'}</td>
                                    <td>
                                        <div class="fw-bold">${s.software_venta?.nombre_sistema || s.planes_web?.nombre_plan || 'N/A'}</div>
                                        <div class="small text-muted">${s.modalidad || ''}</div>
                                    </td>
                                    <td>${s.proximo_vencimiento || '--'}</td>
                                    <td><span class="badge-status ${badgeClass}">${estadoTxt}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary">Renovar</button>
                                        <button class="btn btn-sm btn-outline-danger">Suspender</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 5: GESTIÓN DE PEDIDOS
    // ==========================================
    async function renderPedidos() {
        const { data: pedidos } = await supabaseClient
            .from('pagos')
            .select('*, usuarios(nombre_completo)');
        
        contentArea.innerHTML = `
            <h4 class="fw-bold mb-4">Gestión de Pedidos y Ventas</h4>
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Monto</th>
                            <th>Método</th>
                            <th>Estado</th>
                            <th>Comprobante</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidos.map(p => `
                            <tr>
                                <td>#${p.id}</td>
                                <td>${p.usuarios?.nombre_completo || 'Anon'}</td>
                                <td class="fw-bold">$${p.monto}</td>
                                <td>${p.metodo_pago}</td>
                                <td><span class="badge-status ${p.estado_pago === 'Completado' ? 'bg-light-success text-success' : 'bg-light-warning text-warning'}">${p.estado_pago}</span></td>
                                <td>
                                    ${p.comprobante_url ? `<a href="${p.comprobante_url}" target="_blank" class="btn btn-sm btn-light"><i class="fas fa-file-invoice"></i> Ver</a>` : '<span class="text-muted small">No subido</span>'}
                                    ${p.estado_pago !== 'Completado' ? `<button class="btn btn-sm btn-success ms-2" onclick="aprobarPago(${p.id}, '${p.usuario_id}')" title="Aprobar y Activar"><i class="fas fa-check"></i> Activar</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 6: CENTRO DE SOPORTE TÉCNICO
    // ==========================================
    async function renderSoporte() {
        const { data: tickets } = await supabaseClient
            .from('tickets_soporte')
            .select('*, usuarios(nombre_completo)');
        
        contentArea.innerHTML = `
            <h4 class="fw-bold mb-4">Centro de Soporte (Help Desk)</h4>
            <div class="row g-4">
                ${tickets.map(t => {
                    let priorClass = 'text-primary';
                    if (t.prioridad === 'Urgente') priorClass = 'text-danger';
                    if (t.prioridad === 'Alta') priorClass = 'text-warning';

                    return `
                        <div class="col-md-6">
                            <div class="admin-card">
                                <div class="d-flex justify-content-between mb-3">
                                    <span class="small fw-bold ${priorClass}">${t.prioridad}</span>
                                    <span class="badge-status bg-light-info text-info">${t.estado}</span>
                                </div>
                                <h6 class="fw-bold">${t.asunto}</h6>
                                <p class="small text-muted mb-3">${t.descripcion_problema}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="small"><b>Cliente:</b> ${t.usuarios?.nombre_completo}</div>
                                    <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="openAdminChat('${t.id}', '${t.asunto}')">Responder</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- MODAL DE CHAT PARA ADMIN -->
            <div class="modal fade" id="chatModalAdmin" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
                        <div class="modal-header bg-dark text-white border-0">
                            <h6 class="modal-title fw-bold" id="chatTitleAdmin">Soporte con Cliente</h6>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0 bg-light">
                            <div id="chatMessagesAdmin" style="height: 350px; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px;">
                                <div class="text-center py-5 text-muted">Cargando...</div>
                            </div>
                            <form id="chatFormAdmin" style="border-top: 1px solid #eee; padding: 15px; background: #fff;" class="d-flex gap-2">
                                <input type="text" id="chatInputAdmin" class="form-control rounded-pill border-0 bg-light px-3" placeholder="Responde al cliente..." autocomplete="off">
                                <button type="submit" class="btn btn-dark rounded-circle"><i class="fas fa-paper-plane"></i></button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 3: CATÁLOGO DE PRODUCTOS (SOFTWARE)
    // ==========================================
    async function renderCatalogo() {
        const { data: soft } = await supabaseClient.from('software_venta').select('*').order('id', { ascending: false });
        
        contentArea.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold m-0">Catálogo de Software</h4>
                <button class="btn btn-primary btn-sm" onclick="openProductModal()"><i class="fas fa-plus me-1"></i>Nuevo Software</button>
            </div>
            <div class="row g-4" id="catalogoContainer">
                ${soft.length === 0 ? '<div class="col-12 text-center py-5">No hay productos en el catálogo.</div>' : soft.map(s => `
                    <div class="col-md-4">
                        <div class="admin-card h-100 d-flex flex-column">
                            <img src="${s.url_imagen || 'assets/img/servicios/software-default.jpg'}" class="img-fluid rounded mb-3" style="height: 150px; width: 100%; object-fit: cover;">
                            <h6 class="fw-bold mb-1">${s.nombre_sistema}</h6>
                            <p class="small text-muted flex-grow-1">${s.descripcion?.substring(0, 80)}...</p>
                            <div class="mb-3">
                                <span class="badge bg-light text-primary">S/ ${s.precio_regular}</span>
                                <span class="badge ${s.estado === 'Activo' ? 'bg-success' : 'bg-secondary'} ms-1">${s.estado}</span>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-light flex-grow-1" onclick="openProductModal(${JSON.stringify(s).replace(/"/g, '&quot;')})">Editar</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${s.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- MODAL DE PRODUCTO -->
            <div class="modal fade" id="productFormModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content rounded-4 border-0">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="fw-bold" id="productModalTitle">Nuevo Software</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="productForm">
                            <input type="hidden" id="prodId">
                            <div class="modal-body">
                                <div class="row g-3">
                                    <div class="col-md-8">
                                        <label class="form-label small">Nombre del Sistema</label>
                                        <input type="text" id="prodNombre" class="form-control" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small">Precio (S/)</label>
                                        <input type="number" id="prodPrecio" class="form-control" step="0.01" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label small">Categoría</label>
                                        <select id="prodCategoria" class="form-select">
                                            <option value="sistemas">Sistemas Empresariales</option>
                                            <option value="web">Diseño Web</option>
                                            <option value="movil">Apps Móviles</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label small">Estado</label>
                                        <select id="prodEstado" class="form-select">
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label small">Imagen del Producto</label>
                                        <div class="input-group">
                                            <input type="file" id="prodFile" class="form-control" accept="image/*">
                                            <input type="text" id="prodImagen" class="form-control" placeholder="O pega una URL externa..." style="width: 40%;">
                                        </div>
                                        <div id="uploadStatus" class="small text-muted mt-1"></div>
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label small">Descripción</label>
                                        <textarea id="prodDesc" class="form-control" rows="3"></textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label small">URL Demo</label>
                                        <input type="text" id="prodDemo" class="form-control">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label small">URL Video (Vimeo/YT)</label>
                                        <input type="text" id="prodVideo" class="form-control">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label small fw-bold text-primary">Archivo de Entrega (URL de Descarga)</label>
                                        <input type="text" id="prodDownload" class="form-control" placeholder="Link al zip, setup o proyecto final">
                                        <div class="form-text small">Este link solo será visible para el cliente después de que actives su pago.</div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer border-0 pt-0">
                                <button type="submit" class="btn btn-primary px-4 rounded-pill">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Logic for opening modal
        window.openProductModal = (product = null) => {
            const modal = new bootstrap.Modal(document.getElementById('productFormModal'));
            const form = document.getElementById('productForm');
            form.reset();
            
            if (product) {
                document.getElementById('productModalTitle').textContent = "Editar Software";
                document.getElementById('prodId').value = product.id;
                document.getElementById('prodNombre').value = product.nombre_sistema;
                document.getElementById('prodPrecio').value = product.precio_regular;
                document.getElementById('prodCategoria').value = product.categoria || 'sistemas';
                document.getElementById('prodEstado').value = product.estado || 'Activo';
                document.getElementById('prodImagen').value = product.url_imagen || '';
                document.getElementById('prodDesc').value = product.descripcion || '';
                document.getElementById('prodDemo').value = product.url_demo || '';
                document.getElementById('prodVideo').value = product.url_video || '';
                document.getElementById('prodDownload').value = product.url_descarga || '';
            } else {
                document.getElementById('productModalTitle').textContent = "Nuevo Software";
                document.getElementById('prodId').value = "";
            }
            modal.show();
        };

        const productForm = document.getElementById('productForm');
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = productForm.querySelector('button[type="submit"]');
            const fileInput = document.getElementById('prodFile');
            const id = document.getElementById('prodId').value;
            const statusEl = document.getElementById('uploadStatus');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

            try {
                let imageUrl = document.getElementById('prodImagen').value;

                // 1. Si hay un archivo seleccionado, subirlo primero
                if (fileInput.files.length > 0) {
                    statusEl.innerHTML = "Subiendo imagen...";
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `cat-${Date.now()}-${fileName}`;

                    // Subir a bucket 'productos'
                    const { data: uploadData, error: uploadError } = await supabaseClient
                        .storage
                        .from('productos')
                        .upload(filePath, file);

                    if (uploadError) throw new Error("Error subiendo imagen: " + uploadError.message);

                    // Obtener URL Pública
                    const { data: { publicUrl } } = supabaseClient
                        .storage
                        .from('productos')
                        .getPublicUrl(filePath);
                    
                    imageUrl = publicUrl;
                }

                const data = {
                    nombre_sistema: document.getElementById('prodNombre').value,
                    precio_regular: parseFloat(document.getElementById('prodPrecio').value),
                    categoria: document.getElementById('prodCategoria').value,
                    estado: document.getElementById('prodEstado').value,
                    url_imagen: imageUrl,
                    descripcion: document.getElementById('prodDesc').value,
                    url_demo: document.getElementById('prodDemo').value,
                    url_video: document.getElementById('prodVideo').value,
                    url_descarga: document.getElementById('prodDownload').value
                };

                if (id) {
                    const { error } = await supabaseClient.from('software_venta').update(data).eq('id', id);
                    if (error) throw error;
                } else {
                    const { error } = await supabaseClient.from('software_venta').insert(data);
                    if (error) throw error;
                }
                
                bootstrap.Modal.getInstance(document.getElementById('productFormModal')).hide();
                renderCatalogo();
            } catch (err) {
                alert("Error al guardar: " + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Guardar Cambios";
            }
        });

        // Logic for deleting
        window.deleteProduct = async (id) => {
            if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
            const { error } = await supabaseClient.from('software_venta').delete().eq('id', id);
            if (error) alert("Error: " + error.message);
            else renderCatalogo();
        };
    }

    // ==========================================
    // MÓDULO 7: GESTIÓN DE PLANES WEB
    // ==========================================
    async function renderPlanesWeb() {
        const { data: planes } = await supabaseClient.from('planes_web').select('*');
        contentArea.innerHTML = `
            <h4 class="fw-bold mb-4">Planes de Desarrollo Web</h4>
            <div class="row g-4">
                ${planes.map(p => `
                    <div class="col-md-4">
                        <div class="admin-card border-top border-4 border-primary">
                            <h5 class="fw-bold">${p.nombre_plan}</h5>
                            <div class="display-6 fw-bold text-primary mb-3">$${p.precio}</div>
                            <p class="text-muted small">Estado: <b>${p.estado}</b></p>
                            <button class="btn btn-primary w-100">Editar Características</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 8: GESTIÓN DE LEADS
    // ==========================================
    async function renderLeads() {
        const { data: leads } = await supabaseClient.from('leads').select('*').order('fecha', { ascending: false });
        contentArea.innerHTML = `
            <h4 class="fw-bold mb-4">Leads (Clientes Potenciales)</h4>
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead><tr><th>Fecha</th><th>Nombre</th><th>Empresa</th><th>Interés</th><th>Estado</th><th>Acción</th></tr></thead>
                    <tbody>
                        ${leads.map(l => `
                            <tr>
                                <td class="small">${new Date(l.fecha).toLocaleDateString()}</td>
                                <td><b>${l.nombre}</b><br><small>${l.email}</small></td>
                                <td>${l.empresa || '--'}</td>
                                <td><span class="badge bg-light text-dark">${l.servicio_interes || 'General'}</span></td>
                                <td><span class="badge-status bg-light-primary text-primary">${l.estado}</span></td>
                                <td><a href="https://wa.me/${l.telefono}" target="_blank" class="btn btn-sm btn-outline-success"><i class="fab fa-whatsapp"></i></a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 9: SISTEMA DE OPINIONES
    // ==========================================
    async function renderOpiniones() {
        const { data: opini } = await supabaseClient.from('opiniones_resenas').select('*');
        contentArea.innerHTML = `
            <h4 class="fw-bold mb-4">Moderación de Opiniones</h4>
            <div class="row g-4">
                ${opini.map(o => `
                    <div class="col-md-4">
                        <div class="admin-card">
                            <div class="text-warning mb-2">${'<i class="fas fa-star"></i>'.repeat(o.calificacion)}</div>
                            <p class="small mb-3">"${o.comentario}"</p>
                            <div class="small fw-bold mb-3">- ${o.nombre_autor}</div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-success flex-grow-1">Aprobar</button>
                                <button class="btn btn-sm btn-light flex-grow-1">Rechazar</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ==========================================
    // MÓDULO 10: MARKETING Y PROMOCIONES
    // ==========================================
    async function renderMarketing() {
        const { data: cupones } = await supabaseClient.from('cupones').select('*');
        contentArea.innerHTML = `
            <div class="d-flex justify-content-between mb-4">
                <h4 class="fw-bold m-0">Marketing y Promociones</h4>
                <button class="btn btn-primary btn-sm">Crear Cupón</button>
            </div>
            <div class="row g-4">
                ${cupones.map(c => `
                    <div class="col-md-3">
                        <div class="admin-card text-center border-dashed">
                            <div class="stat-label">CÓDIGO</div>
                            <div class="h5 fw-800 text-primary">${c.codigo}</div>
                            <div class="stat-val fs-1">${c.descuento}%</div>
                            <p class="small text-muted">Vence: ${c.fecha_expiracion}</p>
                            <span class="badge ${c.activo ? 'bg-success' : 'bg-danger'}">${c.activo ? 'Activo' : 'Vencido'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ==========================================
    // MÓDULO: CENTRAL DE WHATSAPP
    // ==========================================
    async function renderWhatsApp() {
        // Obtenemos Leads y Clientes para centralizar contactos
        const { data: leads } = await supabaseClient.from('leads').select('*').limit(20).order('fecha', { ascending: false });
        const { data: clientes } = await supabaseClient.from('usuarios').select('*, clientes(*)').eq('rol', 'cliente').limit(20);
        
        contentArea.innerHTML = `
            <div class="row g-4">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h4 class="fw-bold m-0"><i class="fab fa-whatsapp text-success me-2"></i>Central de WhatsApp</h4>
                        <a href="https://web.whatsapp.com" target="_blank" class="btn btn-primary btn-sm">Abrir Web WhatsApp <i class="fas fa-external-link-alt ms-2"></i></a>
                    </div>
                    <p class="text-muted small mb-4">Gestiona la comunicación directa con tus clientes y leads de forma rápida.</p>
                </div>

                <!-- Plantillas de Mensajes -->
                <div class="col-md-4">
                    <div class="admin-card">
                        <h6 class="fw-bold mb-3"><i class="fas fa-bolt text-warning me-2"></i>Plantillas Rápidas</h6>
                        <div class="list-group list-group-flush bg-transparent">
                            <button class="list-group-item list-group-item-action bg-transparent border-bottom px-0 py-3" onclick="copyToClipboard('Hola! Gracias por contactar a OCA Digital Solutions. ¿En qué podemos ayudarte?')">
                                <span class="d-block fw-bold small text-primary">Saludo Inicial</span>
                                <span class="text-muted small">"Hola! Gracias por contactar a OCA..."</span>
                            </button>
                            <button class="list-group-item list-group-item-action bg-transparent border-bottom px-0 py-3" onclick="copyToClipboard('Hola, te recordamos que tu suscripción está por vencer en 3 días. Realiza tu pago para evitar cortes.')">
                                <span class="d-block fw-bold small text-danger">Recordatorio Pago</span>
                                <span class="text-muted small">"Hola, te recordamos que tu suscrip..."</span>
                            </button>
                            <button class="list-group-item list-group-item-action bg-transparent px-0 py-3" onclick="copyToClipboard('¡Hola! Tenemos un nuevo software POS para tu negocio. Revisa los detalles en oca.com')">
                                <span class="d-block fw-bold small text-success">Oferta Especial</span>
                                <span class="text-muted small">"¡Hola! Tenemos un nuevo software..."</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Lista Única de Contactos -->
                <div class="col-md-8">
                    <div class="admin-card">
                        <h6 class="fw-bold mb-3"><i class="fas fa-address-book text-primary me-2"></i>Contactos Recientes</h6>
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0">
                                <thead>
                                    <tr class="text-muted small uppercase">
                                        <th class="border-0">Nombre / Origen</th>
                                        <th class="border-0">WhatsApp</th>
                                        <th class="border-0">Chat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${clientes.map(c => `
                                        <tr>
                                            <td class="border-0">
                                                <div class="fw-bold small">${c.nombre_completo}</div>
                                                <span class="badge bg-light-primary text-primary" style="font-size:8px">CLIENTE</span>
                                            </td>
                                            <td class="border-0 small text-muted">${c.clientes?.[0]?.telefono || '--'}</td>
                                            <td class="border-0">
                                                <a href="https://wa.me/${c.clientes?.[0]?.telefono}" target="_blank" class="btn btn-link link-success p-0 fs-4"><i class="fab fa-whatsapp"></i></a>
                                            </td>
                                        </tr>
                                    `).join('')}
                                    ${leads.map(l => `
                                        <tr>
                                            <td class="border-0">
                                                <div class="fw-bold small">${l.nombre}</div>
                                                <span class="badge bg-light-warning text-warning" style="font-size:8px">LEAD / WEB</span>
                                            </td>
                                            <td class="border-0 small text-muted">${l.telefono || '--'}</td>
                                            <td class="border-0">
                                                <a href="https://wa.me/${l.telefono}" target="_blank" class="btn btn-link link-success p-0 fs-4"><i class="fab fa-whatsapp"></i></a>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Función auxiliar para copiar plantillas (Global para onclick)
    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('¡Plantilla copiada al portapapeles! Selecciónal contacto y pega el mensaje.');
        });
    };

    // ==========================================
    // MÓDULO 11: ESTADÍSTICAS AVANZADAS
    // ==========================================
    async function renderEstadisticas() {
        contentArea.innerHTML = `
            <h4 class="fw-bold mb-4">Estadísticas de Negocio</h4>
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="admin-card">
                        <h6 class="fw-bold mb-3">Software más Vendido</h6>
                        <canvas id="softStats"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="admin-card">
                        <h6 class="fw-bold mb-3">Conversión de Leads</h6>
                        <canvas id="conversionStats"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        new Chart(document.getElementById('softStats'), {
            type: 'bar',
            data: { labels: ['POS', 'Inventario', 'CRM'], datasets: [{ label: 'Ventas', data: [12, 19, 8], backgroundColor: '#0066FF' }] }
        });
    }

    // Función para aprobar pago y activar servicio mediante la API de Python
    window.aprobarPago = async (paymentId, userId) => {
        if (!confirm("¿Desear aprobar este pago y activar el servicio? Se generará la licencia y se enviará correo al cliente.")) return;

        try {
            // 1. Actualizar el pago en Supabase a 'Completado'
            const { error: pError } = await supabaseClient.from('pagos').update({ estado_pago: 'Completado' }).eq('id', paymentId);
            if (pError) throw pError;

            // 2. Llamar a la API de Python para activar y generar licencia
            const response = await fetch(`${apiUrl}/payments/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_id: paymentId, user_id: userId })
            });

            const result = await response.json();
            if (result.status === 'activated') {
                alert("Servicio activado con éxito. Licencia: " + result.license);
                renderModule('pedidos');
            } else {
                throw new Error(result.detail || "Error en activación");
            }
        } catch (error) {
            console.error("Error activando servicio:", error);
            alert("Error: " + error.message);
        }
    };

    // ==========================================
    // LÓGICA DE CHAT PARA ADMINISTRADOR
    // ==========================================
    let activeChatId = null;
    let adminSubscription = null;

    window.openAdminChat = async (ticketId, title) => {
        activeChatId = ticketId;
        document.getElementById('chatTitleAdmin').textContent = "Soporte: " + title;
        
        const modal = new bootstrap.Modal(document.getElementById('chatModalAdmin'));
        modal.show();

        const container = document.getElementById('chatMessagesAdmin');
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border spinner-border-sm me-2"></div>Abriendo canal...</div>';

        // 1. Cargar mensajes
        const { data: messages } = await supabaseClient
            .from('mensajes_ticket')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('fecha', { ascending: true });

        renderAdminMessages(messages || []);

        // 2. Realtime
        if (adminSubscription) supabaseClient.removeChannel(adminSubscription);
        
        adminSubscription = supabaseClient
            .channel('admin:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_ticket', filter: `ticket_id=eq.${ticketId}` }, payload => {
                appendAdminMessage(payload.new);
            })
            .subscribe();
    };

    function renderAdminMessages(msgs) {
        const container = document.getElementById('chatMessagesAdmin');
        if (msgs.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-5 small">No hay mensajes.</div>';
            return;
        }
        container.innerHTML = msgs.map(m => createAdminMsgHtml(m)).join('');
        container.scrollTop = container.scrollHeight;
    }

    function createAdminMsgHtml(m) {
        const isMe = m.usuario_id === session.user.id;
        return `
            <div style="max-width: 80%; padding: 10px 15px; border-radius: 12px; font-size: 13px; shadow-sm; ${isMe ? 'align-self: flex-end; background: #212529; color: white;' : 'align-self: flex-start; background: #e9ecef; color: #000;'}">
                ${m.mensaje}
                <div style="font-size: 9px; opacity: 0.6; text-align: right; margin-top: 3px;">${new Date(m.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        `;
    }

    function appendAdminMessage(m) {
        const container = document.getElementById('chatMessagesAdmin');
        const empty = container.querySelector('.text-center');
        if (empty) empty.remove();
        container.insertAdjacentHTML('beforeend', createAdminMsgHtml(m));
        container.scrollTop = container.scrollHeight;
    }

    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'chatFormAdmin') {
            e.preventDefault();
            const input = document.getElementById('chatInputAdmin');
            const val = input.value.trim();
            if (!val || !activeChatId) return;

            console.log("Admin enviando mensaje...");
            input.value = '';
            const { error } = await supabaseClient.from('mensajes_ticket').insert({
                ticket_id: parseInt(activeChatId),
                usuario_id: session.user.id,
                mensaje: val
            });

            if (error) {
                console.error("Error enviando respuesta admin:", error);
                alert("Error al enviar respuesta: " + error.message);
                input.value = val;
            }
        }
    });

    // Iniciar con el dashboard
    renderModule('inicio');

})();
