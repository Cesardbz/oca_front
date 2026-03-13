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

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('¡Mensaje enviado con éxito!');
        contactModal.classList.remove('active');
        contactForm.reset();
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
    MANEJO DE SESIÓN / AVATAR
================================ */
function initUserSession() {
    const user = JSON.parse(localStorage.getItem("session"));
    if (!user) return;

    const desktopBtn = document.getElementById("loginBtn");
    const mobileBtn = document.getElementById("mobileLoginBtn");

    [desktopBtn, mobileBtn].forEach(btn => {
        if (!btn) return;

        // evitar duplicados
        if (btn.parentElement.querySelector(".user-avatar")) return;

        btn.style.display = "none";

        const avatar = document.createElement("div");
        avatar.className = "user-avatar";
        avatar.textContent = user.nombre
            ? user.nombre.charAt(0).toUpperCase()
            : "U";

        const menu = document.createElement("div");
        menu.className = "user-menu";
        menu.innerHTML = `
            <a href="#">Perfil</a>
            <a href="#" class="logout">Cerrar sesión</a>
        `;

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.appendChild(avatar);
        wrapper.appendChild(menu);

        btn.parentElement.appendChild(wrapper);

        avatar.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.classList.toggle("show");
        });

        menu.querySelector(".logout").addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("session");
            location.reload();
        });

        document.addEventListener("click", () => {
            menu.classList.remove("show");
        });
    });
}








