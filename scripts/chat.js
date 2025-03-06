

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');

const urlParams = new URLSearchParams(window.location.search);
const sellerID = urlParams.get("sellerID");
const userID = urlParams.get("userID");

if (!sellerID || !userID) {
    console.error("Seller ID или User ID отсутствует в URL");
    alert("Ошибка: Не удалось загрузить данные чата.");
    window.location.href = "/"; 
}

const ws = new WebSocket(`ws://localhost:50055/ws/chat?userID=${userID}`);


async function fetchChatHistory(userID, otherUserID) {
    try {
        const response = await fetch(
            `http://localhost:50055/chat/history?userID=${userID}&otherUserID=${otherUserID}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            }
        );
        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

window.onload = () => {
    fetchChatHistory(userID, sellerID).then(messages => {
        console.log(messages)
        messages.messages.forEach(msg => {
            appendMessage(msg, msg.sender === userID ? "user" : "seller");
        });
    });
};

ws.onopen = () => {
    console.log("WebSocket соединение установлено");
};

ws.onerror = (error) => {
    console.error("WebSocket ошибка:", error);
};

ws.onclose = () => {
    console.log("WebSocket соединение закрыто");
};


document.getElementById('sendButton').addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        const data = {
            participants: [userID, sellerID],
            message: {
                sender: userID,
                content: message
            }
        };

        ws.send(JSON.stringify(data));
        messageInput.value = "";
    }
}


ws.onmessage = (event) => {
    console.log("Raw message:", event.data);
    try {
        const data = JSON.parse(event.data);
        console.log("Parsed data:", data);

        if (data.message) {
            
            if (!data.message.sender || !data.message.content || !data.message.timestamp) {
                console.error("Неправильный формат сообщения:", data.message);
                return;
            }

            
            appendMessage(data.message, data.message.sender === userID ? "user" : "seller");
        } else {
            console.error("Неправильный формат данных:", data);
        }
    } catch (error) {
        console.error("Ошибка обработки сообщения:", error);
    }
};

function appendMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">
            ${new Date(message.timestamp).toLocaleTimeString()}
        </div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
};

ws.onclose = () => {
    console.log('WebSocket Connection Closed');
};

