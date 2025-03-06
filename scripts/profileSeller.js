let userID;
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        // Получаем данные о пользователе
        const userResponse = await fetch('http://localhost:50051/api/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!userResponse.ok) throw new Error('Ошибка загрузки пользователя');
        
        const userData = await userResponse.json();
        document.getElementById('userName').textContent = userData.name;
        console.log(userData)
        // Загружаем список чатов
        userID = userData.ID;
        const chatsResponse = await fetch(`http://localhost:50055/chats?userID=${userData.ID}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!chatsResponse.ok) throw new Error('Ошибка загрузки чатов');
        
        const chats = await chatsResponse.json();
        renderChats(chats, userData.ID);

        const [productsResponse, ratingsResponse, paypalResponse] = await Promise.all([
            fetch(`http://localhost:50052/api/give-all-products/${userData.ID}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`http://localhost:50055/api/ratings/average?userID=${userData.ID}`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`http://localhost:50051/api/user/${userData.ID}/paypal`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);
    
 
        const activeProducts = await productsResponse.json();
        const paypalEmail = await paypalResponse.json();
        const averageRating = await ratingsResponse.json();

        const activeProductsCount = activeProducts.length;
        
        const productsElement = document.querySelector("#activeProductsCount");
        if (productsElement) {
            productsElement.textContent = activeProductsCount;
        } else {
            console.error("Элемент #activeProductsCount не найден!");
        }
        

        document.getElementById('paypalEmail').placeholder = paypalEmail.payPalEmail || '';
        document.querySelector('#averageRating').textContent = `${averageRating.toFixed(1)}/5`;
        

    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки данных');
    }
});

function renderChats(chats, userID) {
    
    
    const chatList = document.querySelector('.inbox-list');
    chatList.innerHTML = ''; 

    if (!chats || !Array.isArray(chats) || chats.length === 0) {
       
        chatList.innerHTML = '<p style="color: white;">Нет активных чатов</p>';
        return;
    }

    chats.forEach(async (chat) => {
        
    
        const otherUserID = chat.participants.find(id => id !== userID);
        
    
        const lastMessageObj = chat.lastMessage || null;
        const lastMessage = lastMessageObj ? lastMessageObj.content : 'Нет сообщений';
        const lastMessageTime = lastMessageObj ? new Date(lastMessageObj.timestamp).toLocaleString() : '-';
    
        
        try {
            const response = await fetch(`http://localhost:50051/api/name/${otherUserID}`);
            if (response.ok) {
                const data = await response.json();
                
                userName = data ;
            }
        } catch (error) {
            console.error("Ошибка получения имени:", error);
        }
    
        const chatItem = document.createElement('div');
        chatItem.classList.add('inbox-item');
    
        chatItem.innerHTML = `
            <div class="user-info">
                <span class="user-name">${userName}</span>
                <span class="message-date">${lastMessageTime}</span>
            </div>
            <div class="message-preview">${lastMessage}</div>
            <button class="action-button mini-button" onclick="openChat('${otherUserID}', '${userID}')">Перейти</button>
        `;
    
        chatList.appendChild(chatItem);
    });
    
}
async function updatePaypalEmail() {
    const emailInput = document.getElementById('paypalEmail');
    const button = emailInput.nextElementSibling;
    const originalText = button.textContent;
    
    try {
        button.textContent = 'Сохранение...';
        button.disabled = true;

        const response = await fetch('http://localhost:50051/api/update-paypal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                userID: userID,
                email: emailInput.value
            })
        });

        if (!response.ok) throw new Error('Ошибка сохранения');
        alert('Email успешно обновлен!');
        
    } catch (error) {
        console.error(error);
        alert('Ошибка при обновлении email');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

function openChat(sellerID, userID) {
    window.location.href = `chat.html?sellerID=${sellerID}&userID=${userID}`;
}