(async function() {
    const profileForm = document.getElementById("profileForm");
    const saveBtn = document.getElementById("saveBtn");

    console.log("Perfil.js cargado e iniciando...");

    // 1. Verificar sesión
    const { data: { session }, error: authError } = await supabaseClient.auth.getSession();

    if (authError || !session) {
        console.log("Sesión no encontrada, redirigiendo a login...");
        window.location.href = "login.html";
        return;
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    console.log("Sesión activa:", userEmail);

    // ==========================================
    // CARGAR TODO EL DASHBOARD
    // ==========================================
    async function initDashboard() {
        console.log("Iniciando Dashboard para usuario:", userId, userEmail);
        try {
            // A. Datos de Perfil (usuarios + clientes)
            let { data: userData, error: userError } = await supabaseClient.from('usuarios').select('*').eq('id', userId).maybeSingle();
            
            if (userError) console.error("Error cargando usuario:", userError);

            // Lógica de Sincronización: Si no hay data para este UUID, buscamos por email
            if (!userData) {
                console.log("No se encontró registro en public.usuarios para el ID actual. Buscando por email...");
                const { data: orphanedUser } = await supabaseClient.from('usuarios').select('*').eq('email', userEmail).neq('id', userId).maybeSingle();
                if (orphanedUser) {
                    console.log("Detectada data huérfana (ID antiguo):", orphanedUser.id);
                    userData = orphanedUser;
                }
            }

            const { data: clientData, error: clientError } = await supabaseClient.from('clientes').select('*').eq('usuario_id', userId).maybeSingle();
            if (clientError) console.error("Error cargando cliente:", clientError);
            
            let finalClientData = clientData;
            if (!finalClientData && userData && userData.id !== userId) {
                const { data: orphanedClient } = await supabaseClient.from('clientes').select('*').eq('usuario_id', userData.id).maybeSingle();
                if (orphanedClient) {
                    console.log("Encontrada data de cliente vinculada al ID antiguo.");
                    finalClientData = orphanedClient;
                }
            }

            const profile = { ...userData, ...(finalClientData || {}) };
            console.log("Perfil final a renderizar:", profile);
            renderProfileInfo(profile);

            // B. Cargar Servicios Adquiridos
            const targetIds = [userId];
            if (userData && userData.id !== userId) targetIds.push(userData.id);

            const { data: services, error: servicesError } = await supabaseClient
                .from('servicios_adquiridos')
                .select('*, software_venta(nombre_sistema), planes_web(nombre_plan)')
                .in('usuario_id', targetIds);
            
            if (servicesError) console.error("Error cargando servicios:", servicesError);

            // B.2 Cargar Licencias Generadas
            const { data: licenses } = await supabaseClient
                .from('licencias')
                .select('*')
                .in('usuario_id', targetIds);

            renderServices(services || [], licenses || []);

            // C. Cargar Pagos
            const { data: payments, error: paymentsError } = await supabaseClient
                .from('pagos')
                .select('*')
                .in('usuario_id', targetIds)
                .order('fecha_transaccion', { ascending: false });
            
            if (paymentsError) console.error("Error cargando pagos:", paymentsError);
            renderPayments(payments || []);

            // D. Cargar Tickets
            const { data: tickets, error: ticketsError } = await supabaseClient
                .from('tickets_soporte')
                .select('*')
                .in('usuario_id', targetIds)
                .order('fecha_creacion', { ascending: false });
            
            if (ticketsError) console.error("Error cargando tickets:", ticketsError);
            renderTickets(tickets || []);

            // E. Actualizar Actividad Reciente
            updateRecentActivity(services, payments, tickets);

        } catch (error) {
            console.error("Error crítico al inicializar dashboard:", error);
            // Intentar quitar el estado de carga aunque sea con error
            document.getElementById('dashUserName').textContent = "Error al cargar";
            document.getElementById('welcomeName').textContent = "Usuario";
        }
    }

    // ==========================================
    // RENDERIZADO DE SECCIONES
    // ==========================================

    function renderProfileInfo(profile) {
        const name = profile.nombre_completo || userEmail;
        
        const elDashName = document.getElementById('dashUserName');
        const elWelcome = document.getElementById('welcomeName');
        const elAvatar = document.getElementById('dashAvatar');

        if (elDashName) elDashName.textContent = profile.nombre_completo || userEmail.split('@')[0];
        if (elWelcome) elWelcome.textContent = name.split(' ')[0];
        if (elAvatar) elAvatar.textContent = (profile.nombre_completo || userEmail).charAt(0).toUpperCase();

        // UI Formulario
        if (profileForm) {
            document.getElementById('nombre_completo').value = profile.nombre_completo || '';
            document.getElementById('email').value = userEmail;
            document.getElementById('telefono').value = profile.telefono || '';
            document.getElementById('empresa').value = profile.empresa || '';
            document.getElementById('pais').value = profile.pais || '';
            document.getElementById('ciudad').value = profile.ciudad || '';
            document.getElementById('direccion').value = profile.direccion || '';
        }
    }

    function renderServices(services, licenses) {
        const tbody = document.getElementById('servicesTableBody');
        const elCount = document.getElementById('countActiveServices');
        
        if (elCount) elCount.textContent = services.filter(s => s.estado === 'Activo').length;
        
        if (!tbody) return;
        
        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No tienes servicios contratados aún.</td></tr>';
            return;
        }

        tbody.innerHTML = services.map(s => {
            const nombre = s.software_venta?.nombre_sistema || s.planes_web?.nombre_plan || 'Servicio';
            
            // Buscar la licencia vinculada a este software
            const lic = licenses.find(l => l.software_id === s.software_id);
            const claveDisplay = lic ? `<code class="small text-primary">${lic.clave_licencia}</code>` : `<span class="text-muted small">Pendiente</span>`;

            return `
                <tr>
                    <td class="fw-bold">${nombre}</td>
                    <td>${new Date(s.fecha_compra).toLocaleDateString()}</td>
                    <td>${s.proximo_vencimiento ? new Date(s.proximo_vencimiento).toLocaleDateString() : 'N/A'}</td>
                    <td><span class="badge ${s.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}">${s.estado}</span></td>
                    <td>${claveDisplay}</td>
                </tr>
            `;
        }).join('');
    }

    function renderPayments(payments) {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody) return;
        
        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay pagos registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(p => {
            let actionHtml = '';
            if (p.estado_pago === 'Pendiente') {
                actionHtml = `<button class="btn btn-sm btn-outline-primary rounded-pill" onclick="startUpload('${p.id}')"><i class="fas fa-upload me-1"></i>Subir</button>`;
            } else if (p.comprobante_url) {
                actionHtml = `<a href="${p.comprobante_url}" target="_blank" class="btn btn-sm btn-light rounded-pill"><i class="fas fa-file-invoice me-1"></i>Ver</a>`;
            }

            return `
                <tr>
                    <td>${new Date(p.fecha_transaccion).toLocaleDateString()}</td>
                    <td>Pago de Servicio</td>
                    <td class="fw-bold text-success">S/ ${p.monto}</td>
                    <td>${p.metodo_pago || 'Transferencia'}</td>
                    <td><span class="badge ${p.estado_pago === 'Completado' ? 'bg-success' : 'bg-warning'}">${p.estado_pago}</span></td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }).join('');
    }

    function renderTickets(tickets) {
        const container = document.getElementById('ticketsList');
        if (!container) return;
        
        if (tickets.length === 0) {
            container.innerHTML = `
                <div class="glass-card text-center py-5">
                    <i class="fas fa-ticket-alt fa-3x mb-3 text-muted"></i>
                    <p class="text-muted">No tienes ningún ticket de soporte abierto.</p>
                </div>`;
            return;
        }

        container.innerHTML = tickets.map(t => `
            <div class="glass-card mb-3 p-3 d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1 fw-bold">${t.asunto || t.tipo_servicio}</h6>
                    <p class="small text-muted mb-0">Estado: <span class="badge ${t.estado === 'Abierto' ? 'bg-primary' : 'bg-success'}">${t.estado}</span> • ${new Date(t.fecha_creacion).toLocaleDateString()}</p>
                </div>
                <button class="btn btn-outline-primary btn-sm">Ver Chat</button>
            </div>
        `).join('');
    }

    function updateRecentActivity(services, payments, tickets) {
        const list = document.getElementById('recentActivityList');
        if (!list) return;
        
        const activities = [];

        if (services?.length) activities.push(`<i class="fas fa-rocket me-2 text-primary"></i> Tienes ${services.length} servicios registrados.`);
        if (payments?.length) activities.push(`<i class="fas fa-credit-card me-2 text-success"></i> Se detectaron ${payments.length} registros de pago.`);
        if (tickets?.length) activities.push(`<i class="fas fa-life-ring me-2 text-warning"></i> Cuentas con ${tickets.length} tickets de soporte.`);

        if (activities.length === 0) {
            list.innerHTML = 'No hay actividad reciente para mostrar.';
        } else {
            list.innerHTML = `<ul class="list-unstyled mb-0">${activities.map(a => `<li class="mb-2">${a}</li>`).join('')}</ul>`;
        }
    }

    // ==========================================
    // GUARDAR CAMBIOS PERFIL
    // ==========================================
    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const originalBtnText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

            const updatedData = {
                nombre_completo: document.getElementById('nombre_completo').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                empresa: document.getElementById('empresa').value.trim(),
                pais: document.getElementById('pais').value.trim(),
                ciudad: document.getElementById('ciudad').value.trim(),
                direccion: document.getElementById('direccion').value.trim(),
            };

            try {
                // Upsert usuarios
                const { error: errorUser } = await supabaseClient
                    .from('usuarios')
                    .upsert({ id: userId, nombre_completo: updatedData.nombre_completo, email: userEmail });

                if (errorUser) throw errorUser;

                // Upsert clientes
                const { error: errorClient } = await supabaseClient
                    .from('clientes')
                    .upsert({
                        usuario_id: userId,
                        telefono: updatedData.telefono,
                        empresa: updatedData.empresa,
                        pais: updatedData.pais,
                        ciudad: updatedData.ciudad,
                        direccion: updatedData.direccion
                    }, { onConflict: 'usuario_id' });

                if (errorClient) throw errorClient;

                alert("¡Dashboard actualizado con éxito!");
                initDashboard();

            } catch (error) {
                console.error("Error al guardar:", error);
                alert("Error al guardar: " + error.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Iniciar Dashboard inmediatamente
    initDashboard();

})();
