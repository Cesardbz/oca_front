// ==============================
// UTILIDADES
// ==============================
function isMobile() {
    return window.innerWidth <= 991;
}

// ==============================
// ELEMENTOS BASE
// ==============================
const overlay = document.getElementById('overlay');

// ==============================
// OVERLAY (CIERRA MENÚ MÓVIL Y CONTACTO)
// ==============================
overlay.addEventListener('click', () => {
    mobileMenuPanel.classList.remove('active');
    overlay.classList.remove('active');
    contactModal.classList.remove('active');
});


// ==============================
// MOBILE MENU
// ==============================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenuPanel = document.getElementById('mobileMenuPanel');
const closeMobileMenu = document.getElementById('closeMobileMenu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuPanel.classList.add('active');
        overlay.classList.add('active');
        renderMobileAvatar();
    });
}

if (closeMobileMenu) {
    closeMobileMenu.addEventListener('click', () => {
        mobileMenuPanel.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// ==============================
// CONTACTO FLOTANTE
// ==============================
const mainContactBtn = document.getElementById('mainContactBtn');
const contactOptions = document.getElementById('contactOptions');
const whatsappBtn = document.getElementById('whatsappBtn');
const emailBtn = document.getElementById('emailBtn');

if (mainContactBtn) {
    mainContactBtn.addEventListener('click', () => {
        contactOptions.classList.toggle('active');
        mainContactBtn.style.transform =
            contactOptions.classList.contains('active')
                ? 'rotate(45deg)'
                : 'rotate(0deg)';
    });
}

if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
        console.log('WhatsApp pendiente');
        contactOptions.classList.remove('active');
        mainContactBtn.style.transform = 'rotate(0deg)';
    });
}

// ==============================
// CONTACT MODAL
// ==============================
const contactModal = document.getElementById('contactModal');
const closeContactModal = document.getElementById('closeContactModal');
const contactForm = document.getElementById('contactForm');

if (emailBtn) {
    emailBtn.addEventListener('click', () => {
        contactModal.classList.add('active');
        contactOptions.classList.remove('active');
    });
}

if (closeContactModal) {
    closeContactModal.addEventListener('click', () => {
        contactModal.classList.remove('active');
    });
}

if (contactModal) {
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            contactModal.classList.remove('active');
        }
    });
}

// ==============================
// GESTIÓN DE ENVÍO DE FORMULARIOS A SUPABASE
// ==============================

// Función genérica para enviar leads
async function submitLead(leadData, formElement) {
    const submitBtn = formElement.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        // Estado de carga
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

        const { error } = await supabaseClient
            .from('leads')
            .insert([leadData]);

        if (error) throw error;

        // Éxito
        alert('¡Mensaje enviado con éxito! Nos contactaremos contigo pronto.');
        formElement.reset();
        if (contactModal) contactModal.classList.remove('active');
        
    } catch (error) {
        console.error('Error al enviar lead:', error);
        alert('Hubo un error al enviar el mensaje: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// 1. Formulario Modal (Header)
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const leadData = {
            nombre: document.getElementById('modal-nombre')?.value,
            email: document.getElementById('modal-email')?.value,
            telefono: document.getElementById('modal-telefono')?.value,
            servicio_interes: document.getElementById('modal-asunto')?.value,
            mensaje: document.getElementById('modal-comentario')?.value
        };
        await submitLead(leadData, contactForm);
    });
}

// 2. Formulario Principal (Index)
const mainContactForm = document.getElementById('mainContactForm');
if (mainContactForm) {
    mainContactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const leadData = {
            nombre: document.getElementById('name')?.value,
            email: document.getElementById('email')?.value,
            servicio_interes: document.getElementById('servicio')?.value,
            mensaje: document.getElementById('message')?.value
        };
        await submitLead(leadData, mainContactForm);
    });
}

// ==============================
// BOTONES CONTACTO NAV / MOBILE
// ==============================
const mobileContactBtn = document.getElementById('mobileContactBtn');
const navContactBtn = document.getElementById('navContactBtn');
const heroContactBtn = document.getElementById('heroContactBtn');
const ctaContactBtn = document.getElementById('ctaContactBtn');

if (mobileContactBtn) {
    mobileContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        contactModal.classList.add('active');
        mobileMenuPanel.classList.remove('active');
        overlay.classList.remove('active');
    });
}

if (navContactBtn) {
    navContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        contactModal.classList.add('active');
    });
}

if (heroContactBtn) {
    heroContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        contactModal.classList.add('active');
    });
}

if (ctaContactBtn) {
    ctaContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        contactModal.classList.add('active');
    });
}



/* ===============================
    MANEJO DE SESIÓN CON SUPABASE
================================ */
// La sesión se maneja dinámicamente inyectando el avatar en el DOM
async function initUserSession() {
    // Escuchar cambios en la sesión
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        const desktopBtn = document.getElementById("loginBtn");
        const mobileBtn = document.getElementById("mobileLoginBtn");

        if (session) {
            // Usuario está logueado
            const user = session.user;
            const name = user.user_metadata?.full_name || user.email.split('@')[0];

            [desktopBtn, mobileBtn].forEach(btn => {
                if (!btn) return;

                // Verificamos si ya existe el dropdown para no duplicarlo
                let wrapper = btn.parentElement.querySelector(".user-session-wrapper");
                if (wrapper) return;

                btn.style.display = "none";

                wrapper = document.createElement("div");
                wrapper.className = "user-session-wrapper d-flex align-items-center ms-3"; // ms-3 para separación clara del menú central
                wrapper.style.position = "relative";

                const avatar = document.createElement("div");
                avatar.className = "user-avatar";
                avatar.textContent = name.charAt(0).toUpperCase();

                const menu = document.createElement("div");
                menu.className = "user-menu";
                menu.innerHTML = `
                    <div class="px-3 py-2 border-bottom small text-muted text-truncate" style="max-width: 150px;">
                        ${user.email}
                    </div>
                    <a href="#" id="dashboardLink" style="display:none;"><i class="fas fa-chart-line me-2"></i>Dashboard</a>
                    <a href="perfil.html"><i class="fas fa-user-circle me-2"></i>Mi Perfil</a>
                    <a href="#" class="logout-btn text-danger"><i class="fas fa-sign-out-alt me-2"></i>Cerrar sesión</a>
                `;

                wrapper.appendChild(avatar);
                wrapper.appendChild(menu);
                btn.parentElement.appendChild(wrapper);

                // Verificar si es admin para mostrar link al dashboard
                checkAdminStatus(user.id, menu);

                avatar.addEventListener("click", (e) => {
                    e.stopPropagation();
                    menu.classList.toggle("show");
                });

                menu.querySelector(".logout-btn").addEventListener("click", async (e) => {
                    e.preventDefault();
                    await supabaseClient.auth.signOut();
                    location.reload();
                });
            });
        } else {
            // No hay sesión
            [desktopBtn, mobileBtn].forEach(btn => {
                if (!btn) return;
                btn.style.display = "block";
                const wrapper = btn.parentElement.querySelector(".user-session-wrapper");
                if (wrapper) wrapper.remove();
            });
        }
    });

    document.addEventListener("click", () => {
        document.querySelectorAll(".user-menu").forEach(m => m.classList.remove("show"));
    });
}

// Función para ver si el usuario es admin y mostrar el link
async function checkAdminStatus(userId, menuElement) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('rol')
            .eq('id', userId)
            .single();
        
        if (data && data.rol === 'admin') {
            const dashLink = menuElement.querySelector("#dashboardLink");
            if (dashLink) dashLink.style.display = "block";
        }
    } catch (err) {
        console.error("Error verificando rol:", err);
    }
}

// Iniciar sesión y checkout logic
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        initUserSession();
        checkAndLoadCheckout();
    });
} else {
    initUserSession();
    checkAndLoadCheckout();
}

function checkAndLoadCheckout() {
    // Cargar checkout.js dinámicamente si no está presente
    if (!document.querySelector('script[src*="checkout.js"]')) {
        const script = document.createElement('script');
        script.src = 'assets/js/checkout.js';
        document.head.appendChild(script);
    }
}








