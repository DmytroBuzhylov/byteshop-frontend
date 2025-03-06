const token = localStorage.getItem('token');

async function checkAdmin() {
    try {
        const response = await fetch("http://localhost:50051/auth/admin", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error("Ошибка проверки прав:", error);
        return false;
    }
}

async function loadUsers() {
    if (!await checkAdmin()) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch("http://localhost:50054/admin/users", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error("Ошибка загрузки пользователей:", error);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '';

    users.forEach(user => {
        let IsBanned;
        if (user.IsBanned == "false") {
            IsBanned = false
        } else if (user.IsBanned == "true") {
            IsBanned = true
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.UserId}</td>
            <td>${user.Name}</td>
            <td>${user.Email}</td>
            <td>${user.Role}</td>
            <td>
                <div class="user-actions">
                    <button class="admin-btn role-btn" onclick="changeRole('${user.UserId}')">
                        Сменить роль
                    </button>
                    <button class="admin-btn ban-btn" onclick="toggleBan('${user.UserId}', ${IsBanned})">
                        ${IsBanned ? 'Разбанить' : 'Забанить'}
                    </button>
                    <button class="admin-btn delete-btn" onclick="deleteUserProducts('${user.UserId}')">
                        Удалить товары
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function changeRole(userId) {
    
    const newRole = prompt('Введите новую роль (admin/user):');
    if (!newRole) return;
    
    try {
        const response = await fetch(`http://localhost:50054/admin/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        if (response.ok) {
            alert('Роль успешно изменена');
            loadUsers();
        }
    } catch (error) {
        console.error("Ошибка смены роли:", error);
    }
}

async function toggleBan(userId, isBanned) {
    try {
        const response = await fetch(`http://localhost:50054/admin/ban/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ banned: !isBanned })
        });
        
        if (response.ok) {
            alert(`Пользователь ${isBanned ? 'разбанен' : 'забанен'}`);
            loadUsers();
        }
    } catch (error) {
        console.error("Ошибка бана:", error);
    }
}

async function deleteUserProducts(userId) {
    if (!confirm('Удалить все товары пользователя?')) return;

    try {
        const response = await fetch(`http://localhost:50051/users/${userId}/products`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Товары удалены');
            loadUsers();
        }
    } catch (error) {
        console.error("Ошибка удаления товаров:", error);
    }
}


document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

loadUsers();