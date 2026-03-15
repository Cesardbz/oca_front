/**
 * checkout.js - OCA Digital Solutions
 * Maneja el flujo de compra, selección de pago y registro en Supabase.
 */

window.Checkout = {
    currentConfig: null,
    apiUrl: window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : 'https://tu-app.onrender.com/api',

    init() {
        if (!document.getElementById('checkoutModal')) {
            this.injectModal();
        }
    },

    injectModal() {
        const modalHtml = `
            <div class="modal fade" id="checkoutModal" tabindex="-1" aria-hidden="true" style="color: #1e293b;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="fw-bold"><i class="fas fa-shopping-cart text-primary me-2"></i>Finalizar Contratación</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="p-3 mb-3" style="background: #f8fafc; border-radius: 12px;">
                                <h6 class="fw-bold mb-1" id="checkoutItemName">Cargando...</h6>
                                <p class="text-primary fw-bold mb-0" id="checkoutItemPrice">S/ 0.00</p>
                            </div>

                            <p class="small text-muted mb-3">Selecciona tu método de pago:</p>
                            
                            <div class="d-grid gap-2 mb-4">
                                <button class="btn btn-outline-primary text-start p-3 d-flex align-items-center justify-content-between" onclick="Checkout.selectMethod('BCP')">
                                    <span><i class="fas fa-university me-3"></i>Transferencia BCP / Yape (Perú)</span>
                                    <i class="fas fa-chevron-right small"></i>
                                </button>
                                <button class="btn btn-outline-primary text-start p-3 d-flex align-items-center justify-content-between" onclick="Checkout.selectMethod('PAYPAL')">
                                    <span><i class="fab fa-paypal me-3"></i>PayPal (Internacional)</span>
                                    <i class="fas fa-chevron-right small"></i>
                                </button>
                            </div>

                            <!-- DIV DETALLES BCP -->
                            <div id="details-BCP" class="payment-details d-none p-3 border rounded-3 mb-3">
                                <p class="small mb-2"><strong>Cuenta Corriente BCP:</strong> 123-456789-0-12</p>
                                <p class="small mb-2"><strong>CCI:</strong> 002-123456789012-00</p>
                                <p class="small mb-0"><strong>Titular:</strong> OCA Digital Solutions</p>
                            </div>

                            <!-- DIV DETALLES PAYPAL -->
                            <div id="details-PAYPAL" class="payment-details d-none p-3 border rounded-3 mb-3">
                                <p class="small mb-2">Haz clic en el botón para ir a PayPal:</p>
                                <a href="https://paypal.me/ocadigital" target="_blank" class="btn btn-info w-100 text-white fw-bold">Ir a PayPal.me</a>
                            </div>

                            <div id="checkoutFeedback" class="alert d-none small"></div>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary rounded-pill px-4" id="btnConfirmCheckout" disabled onclick="Checkout.confirm()">
                                Confirmar y Registrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    async open(config) {
        // config = { type: 'software'|'plan', id: UUID, name: string, price: float }
        this.currentConfig = config;
        this.init(); // Asegura que el modal exista

        const { data: { session } } = await supabaseClient.auth.getSession();
        
        const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        document.getElementById('checkoutItemName').textContent = config.name;
        document.getElementById('checkoutItemPrice').textContent = `S/ ${config.price.toFixed(2)}`;
        
        // Reset modal state
        document.querySelectorAll('.payment-details').forEach(d => d.classList.add('d-none'));
        document.getElementById('btnConfirmCheckout').disabled = true;
        document.getElementById('checkoutFeedback').classList.add('d-none');
        document.getElementById('btnConfirmCheckout').classList.remove('d-none'); // Mostrar por defecto

        if (!session) {
            // Mostrar estado "Inicia Sesión"
            const feedback = document.getElementById('checkoutFeedback');
            feedback.className = "alert alert-warning small d-block";
            feedback.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Cuenta requerida:</strong> Para procesar tu pedido y vincularlo a tu perfil, necesitas tener una cuenta. 
                <div class="mt-3 d-flex gap-2">
                    <a href="login.html" class="btn btn-sm btn-primary rounded-pill px-3">Iniciar Sesión</a>
                    <a href="login.html?signup=true" class="btn btn-sm btn-outline-primary rounded-pill px-3">Registrarme</a>
                </div>
            `;
            document.getElementById('btnConfirmCheckout').classList.add('d-none');
        }

        modal.show();
    },

    selectMethod(method) {
        this.selectedMethod = method;
        document.querySelectorAll('.payment-details').forEach(d => d.classList.add('d-none'));
        document.getElementById(`details-${method}`).classList.remove('d-none');
        document.getElementById('btnConfirmCheckout').disabled = false;
    },

    async confirm() {
        const btn = document.getElementById('btnConfirmCheckout');
        const feedback = document.getElementById('checkoutFeedback');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registrando...';

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const userId = session.user.id;

            const payload = {
                user_id: userId,
                product_id: this.currentConfig.id,
                product_type: this.currentConfig.type,
                amount: this.currentConfig.price,
                method: this.selectedMethod === 'BCP' ? 'Transferencia BCP' : 'PayPal'
            };

            const response = await fetch(`${this.apiUrl}/payments/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status !== 'success') throw new Error(result.detail || 'Error al procesar');

            // 3. Éxito
            feedback.className = "alert alert-success small";
            feedback.textContent = "¡Pedido registrado! Tu solicitud está siendo procesada. Recibirás un correo con tu licencia pronto.";
            feedback.classList.remove('d-none');

            setTimeout(() => {
                window.location.href = "perfil.html";
            }, 3000);

        } catch (error) {
            console.error("Error en checkout:", error);
            feedback.className = "alert alert-danger small";
            feedback.textContent = "Error: " + error.message;
            feedback.classList.remove('d-none');
            btn.disabled = false;
            btn.textContent = "Confirmar y Registrar";
        }
    }
};

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', () => Checkout.init());
