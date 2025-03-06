const ip = "192.168.50.142"
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        const response = await fetch(`http://${ip}:50051/api/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const userData = await response.json();

        const userName = document.getElementById('userName');
        userName.textContent = `${userData.name}`;

        updateSellerButton(userData.role);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить данные пользователя');
    }
});

function updateSellerButton(role) {
    const btn = document.getElementById('sellerBtn');
    if (role === 'seller' || role === 'admin' || role === 'owner') {
        btn.textContent = 'Перейти к профилю торговца';
        btn.style.background = 'linear-gradient(45deg, #8E53FF, #6B6BFF)';
        btn.onclick = () => window.location.href = 'profileSeller.html';
    } else {
        btn.onclick = openModal;
    }
}



function openModal() {
    document.getElementById('sellerModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('sellerModal').style.display = 'none';
}

async function submitSellerRequest() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`http://${ip}:50051/api/user/become-seller`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ acceptTerms: true })
        });

        if (!response.ok) throw new Error('Ошибка запроса');
        
        const result = await response.json();
        console.log(response, result)
        if (result.success) {
            alert('Вы успешно стали продавцом!');
            updateSellerButton('seller');
            closeModal();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при обработке запроса');
    }
}

let userID;
let currentUser = null;

function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
    } catch (e) {
        return null;
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        const userResponse = await fetch(`http://${ip}:50051/api/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!userResponse.ok) throw new Error('Ошибка загрузки пользователя');
        
        const userData = await userResponse.json();
        document.getElementById('userName').textContent = userData.name;
        userID = userData.ID;
        currentUser = userData;
        
        await fetchUserOrders();

        const chatsResponse = await fetch(`http://${ip}:50055/chats?userID=${userData.ID}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!chatsResponse.ok) throw new Error('Ошибка загрузки чатов');
        
        const chats = await chatsResponse.json();
        renderChats(chats, userData.ID);
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки данных');
    }
});

async function fetchUserName(userID) {
    try {
        const response = await fetch(`http://${ip}:50051/api/name/${userID}`);
        if (response.ok) {
            const data = await response.json();
            
            return data || "Неизвестный пользователь";
        }
    } catch (error) {
        console.error("Ошибка получения имени:", error);
    }
    return "Неизвестный пользователь";
}

async function renderChats(chats, userID) {
    const chatList = document.querySelector('.chats-list');
    chatList.innerHTML = '';

    if (!chats || !Array.isArray(chats) || chats.length === 0) {
        chatList.innerHTML = '<p style="color: white;">Нет активных чатов</p>';
        return;
    }

    for (const chat of chats) {
        const otherUserID = chat.participants.find(id => id !== userID);
        
        const otherUserName = otherUserID ? await fetchUserName(otherUserID) : "Неизвестный";
        
        const lastMessageObj = chat.lastMessage;
        const lastMessage = lastMessageObj ? lastMessageObj.content : 'Нет сообщений';
        const lastMessageTime = lastMessageObj ? new Date(lastMessageObj.timestamp).toLocaleDateString() : '-';

        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.innerHTML = `
            <div class="chat-header">
                <span class="seller-name">${otherUserName}</span>
                <span class="chat-date">${lastMessageTime}</span>
            </div>
            <div class="chat-preview">${lastMessage}</div>
            <button class="action-button mini-button" onclick="openChat('${otherUserID}', '${userID}')">Открыть чат</button>
        `;
        chatList.appendChild(chatItem);
    }
}

function openChat(chatID, userID) {
    window.location.href = `chat.html?sellerID=${chatID}&userID=${userID}`;
}

async function fetchUserOrders() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        const response = await fetch(`http://${ip}:50057/api/user-orders/${userID}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Ошибка загрузки заказов');

        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить заказы');
    }
}

function renderOrders(orders) {
    const gamesGrid = document.querySelector('.games-grid');
    gamesGrid.innerHTML = ''; 

    if (!orders || orders.length === 0) {
        gamesGrid.innerHTML = '<p>У вас пока нет приобретенных товаров.</p>';
        return;
    }

    orders.forEach(order => {
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card');

        gameCard.innerHTML = `
            <img src="https://via.placeholder.com/400x180" alt="Игра">
            <h3>${order.productID}</h3>
            <p>Статус: ${order.status}</p>
            <p>Сумма: ${order.amount} руб.</p>
            <p>Дата заказа: ${new Date(order.created_at).toLocaleDateString()}</p>
            <button class="action-button">Получить ключ</button>
        `;

        gamesGrid.appendChild(gameCard);
    });
}