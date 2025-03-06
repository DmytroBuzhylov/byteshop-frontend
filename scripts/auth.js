const formSwitcher = document.querySelector('.form-switcher');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

formSwitcher.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const form = e.target.getAttribute('data-form');

        
        formSwitcher.querySelectorAll('button').forEach(button => {
            button.classList.remove('active');
        });

        
        e.target.classList.add('active');

        
        if (form === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else if (form === 'register') {
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }
});


function showMessage(text, type = "success") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}


loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    try {
        const response = await fetch("http://localhost:50051/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok && data.token) {
            localStorage.setItem("token", data.token); 
            showMessage("Вход выполнен успешно!", "success");
            setTimeout(() => window.location.href = "/profile.html", 1000); 
        } else {
            showMessage(data.error || "Ошибка входа", "error");
        }
        console.log(data)
    } catch (error) {
        showMessage("Ошибка сети", "error");
    }
});


registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = registerForm.querySelector('input[type="text"]').value;
    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        showMessage("Пароли не совпадают!", "error");
        return;
    }

    try {
        const response = await fetch("http://localhost:50051/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (response.ok && data.token) {
            localStorage.setItem("token", data.token); // Сохраняем токен
            showMessage("Регистрация успешна!", "success");
            setTimeout(() => window.location.href = "/index.html", 1000);
            
        } else {
            showMessage(data.error || "Ошибка регистрации", "error");
        }
        
    } catch (error) {
        showMessage("Ошибка сети", "error");
    }
    
});

// Проверка авторизации при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) {
        fetch("http://localhost:50051/user/profile", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(user => {
            if (user.error) {
                localStorage.removeItem("token");
            } else {
                window.location.href = "/index.html"; // Если уже авторизован, перебросить на профиль
            }
        })
        .catch(() => {});
    }
});
