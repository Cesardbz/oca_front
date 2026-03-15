function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const goRegister = document.getElementById("goRegister");
const goLogin = document.getElementById("goLogin");

/* CAMBIO DE FORMULARIOS */
goRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.remove("active");
    registerForm.classList.add("active");
});

goLogin.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.classList.remove("active");
    loginForm.classList.add("active");
});

/* FUNCIÓN PARA REDIRECCIONAR SEGÚN ROL */
async function redirectByUserRole(userId) {
    try {
        console.log("Verificando rol para el ID:", userId);
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('rol, nombre_completo')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn("No se encontró perfil en la tabla 'usuarios' (aún). Redirigiendo a inicio...");
            window.location.href = "index.html";
            return;
        }

        console.log("Usuario encontrado:", data);

        if (data.rol === 'admin') {
            console.log("¡Es Admin! Redirigiendo al dashboard...");
            window.location.href = "admin/dashboard.html";
        } else {
            console.log("Es Cliente. Redirigiendo a inicio...");
            window.location.href = "index.html";
        }
    } catch (err) {
        console.error("Error crítico en redirección:", err);
        window.location.href = "index.html";
    }
}

/* LOGIN CON SUPABASE */
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const btn = loginForm.querySelector('button');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.textContent = "Validando...";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        showToast("¡Bienvenido de nuevo!", "success");
        
        // Pequeño delay para asegurar que la sesión se guarde bien
        setTimeout(() => {
            redirectByUserRole(data.user.id);
        }, 800);

    } catch (error) {
        console.error("Error login:", error);
        showToast("Error: Correo o contraseña incorrectos", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});


/* REGISTRO CON SUPABASE */
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const btn = registerForm.querySelector('button');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.textContent = "Creando cuenta...";

        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });

        if (authError) throw authError;

        showToast("Registro exitoso. ¡Iniciando!", "success");
        
        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);

    } catch (error) {
        console.error("Error registro:", error);
        showToast(error.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});
