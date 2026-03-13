// Contact buttons functionality
const navContactBtn = document.getElementById('navContactBtn');
const ctaContactBtn = document.getElementById('ctaContactBtn');

if (navContactBtn) {
    navContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Redirige a index.html con hash para abrir el modal
        window.location.href = 'index.html#contact';
    });
}

if (ctaContactBtn) {
    ctaContactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Redirige a index.html con hash para abrir el modal
        window.location.href = 'index.html#contact';
    });
}

// Smooth scroll para navegación interna
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animación al hacer scroll (opcional)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar elementos para animación
document.querySelectorAll('.about-card, .value-card, .team-card, .project-card, .why-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});