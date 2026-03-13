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

/* CARGA DE USUARIOS */
async function loadUsers() {
    let users = localStorage.getItem("users");

    if (users) {
        return JSON.parse(users);
    }

    const response = await fetch("data/users.json");
    users = await response.json();
    localStorage.setItem("users", JSON.stringify(users));
    return users;
}

/* LOGIN */
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    const users = await loadUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showToast("Correo o contraseña incorrectos", "error");
        return;
    }

    localStorage.setItem("session", JSON.stringify(user));
    showToast("Inicio de sesión exitoso", "success");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
});


/* REGISTRO */
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const users = await loadUsers();

    if (users.some(u => u.email === registerEmail.value)) {
        showToast("Este correo ya está registrado", "error");
        return;
    }

    const newUser = {
        id: Date.now(),
        nombre: registerName.value,
        email: registerEmail.value,
        password: registerPassword.value
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("session", JSON.stringify(newUser));

    showToast("Registro exitoso", "success");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1500);
});

