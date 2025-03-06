const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

const token = localStorage.getItem("token");
let currentUser = null;
let currentProduct = null;

// Парсим токен, чтобы получить данные пользователя
if (token) {
    currentUser = parseJwt(token);
    console.log("Текущий пользователь:", currentUser);
}


// Функция для парсинга JWT токена
function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
    } catch (e) {
        return null;
    }
}

// Обработчик кнопки "Чат с продавцом"
document.addEventListener("DOMContentLoaded", async () => {
    const chatButton = document.getElementById("chatWithSeller");
    if (!chatButton) return; // Если кнопки нет, выходим
    console.log(1)
    // Ждем загрузки данных
    await waitForData();

    if (!currentProduct || !currentUser) return;

    const sellerID = currentProduct.userID;
    const userID = currentUser.user_id;

    console.log("Проверка скрытия кнопки", { sellerID, userID });

    if (sellerID === userID) {
        chatButton.parentElement.style.display = "none"; 
    }

    chatButton.addEventListener("click", () => {
        if (!currentProduct) {
            alert("Информация о продукте не загружена.");
            return;
        }

        if (!currentUser) {
            alert("Пожалуйста, войдите в систему, чтобы начать чат с продавцом.");
            return;
        }

        window.location.href = `chat.html?sellerID=${sellerID}&userID=${userID}`;
    });
});


async function waitForData() {
    return new Promise((resolve) => {
        const checkData = () => {
            if (currentProduct && currentUser) {
                resolve();
            } else {
                setTimeout(checkData, 100); 
            }
        };
        checkData();
    });
}


async function checkAdminRights() {
    if (!token) return false;

    try {
        const response = await fetch("http://localhost:50051/auth/admin", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) throw new Error("Ошибка проверки прав администратора");

        const data = await response.json();
        return data.status === "Token is valid";
    } catch (error) {
        console.error("Ошибка проверки администратора:", error);
        return false;
    }
}


async function fetchProduct(productId) {
    try {
        const response = await fetch(`http://localhost:50052/product/${productId}`);
        if (!response.ok) {
            throw new Error("Продукт не найден");
        }

        const product = await response.json();
        renderProduct(product);
    } catch (error) {
        console.error("Ошибка:", error);
        document.getElementById("productName").textContent = "Продукт не найден";
    }
}
let productPrice;

async function renderProduct(product) {
    currentProduct = product;
    console.log(currentProduct.ca)
    
    document.getElementById("productName").textContent = product.name;
    document.getElementById("productPrice").textContent = `${product.price.toFixed(2)} ГРН`;
    productPrice = product / 41.46 ;
    
    document.getElementById("productFeatures").innerHTML = 
    `<li>${product.description.replace(/\r?\n/g, '<br>')}</li>`;

   
    document.getElementById("mainImage").src = `http://localhost:50052${product.imageURL}`;

    
    if (await checkAdminRights()) {
        showAdminPanel();
    }

        
        const similarResponse = await fetch(`http://localhost:50052/products/${currentProduct.category}`);
        if (similarResponse.ok) {
            const similarProducts = await similarResponse.json();
            renderSimilarProducts(similarProducts);
        }


        try {
            const ratingResponse = await fetch(`http://localhost:50055/api/ratings/average?userID=${product.userID}`);
            if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                console.log(ratingData)
                const starsContainer = document.querySelector('.seller-rating-stars');
                const ratingValue = document.querySelector('.seller-rating-value');
    
                if (starsContainer && ratingValue) {
                    starsContainer.innerHTML = 
                        '★'.repeat(Math.round(ratingData)) +
                        '☆'.repeat(5 - Math.round(ratingData));
                    ratingValue.textContent = `${ratingData.toFixed(1)}/5`;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки рейтинга продавца:', error);
        }
}

function renderSimilarProducts(products) {
    const container = document.getElementById('similarProducts');
    container.innerHTML = products
        .filter(product => product.productID !== currentProduct.productID) 
        .map(product => `
            <div class="product-card mini">
                <img src="http://localhost:50052${product.imageURL}" alt="${product.name}">
                <div class="product-content">
                    <div>
                        <div class="product-name">${product.name}</div>
                        <div class="price">${product.price.toFixed(2)} ГРН</div>
                    </div>
                <button class="action-button mini-button" 
                    onclick="location.href='product.html?id=${product.productID}'">
                    Посмотреть
                </button>
            </div>
        </div>
        `)
        .join('');


    if (products.length - 1 < 3) { 
        container.style.justifyContent = 'flex-start';
    } else {
        container.style.justifyContent = 'space-between';
    }

    }



function showAdminPanel() {
    const adminPanel = document.createElement("div");
    adminPanel.className = "admin-panel";
    adminPanel.innerHTML = `
        <button class="admin-btn">Админ-панель</button>
        <div class="admin-modal">
            <div class="admin-option" onclick="handleAdminAction('delete')">Удалить товар</div>
            <div class="admin-option" onclick="handleAdminAction('ban')">Забанить продавца (ID: ${currentProduct.userID})</div>
        </div>
    `;

    document.body.appendChild(adminPanel);

    const adminBtn = adminPanel.querySelector(".admin-btn");
    const adminModal = adminPanel.querySelector(".admin-modal");

    adminBtn.addEventListener("click", () => {
        adminModal.style.display = "block";
    });

    document.addEventListener("click", (e) => {
        if (!adminPanel.contains(e.target)) {
            adminModal.style.display = "none";
        }
    });
}


async function handleAdminAction(action) {
    const confirmation = confirm(`Вы уверены, что хотите ${action === "delete" ? "удалить товар" : "забанить продавца"}?`);
    if (!confirmation) return;

    try {
        let url, method;
        if (action === "delete") {
            url = `http://localhost:50054/admin/delete/product/${productId}`;
            method = "DELETE";
        } else {
            url = `http://localhost:50054/admin/ban/by-product-id/${productId}`;
            method = "PUT";
        }

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            alert("Действие успешно выполнено!");
            if (action === "delete") window.location.href = "/";
        } else {
            throw new Error("Ошибка выполнения действия");
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Произошла ошибка при выполнении действия");
    }
}




if (productId) {
    fetchProduct(productId);
} else {
    document.getElementById("productName").textContent = "ID продукта не указан";
}


document.getElementById("chatWithSeller").addEventListener("click", (e) => {
    if (!currentUser) {
        e.preventDefault();
        document.getElementById("authModal").style.display = "block";
    }
});


document.addEventListener("click", (e) => {
    if (e.target === document.getElementById("authModal")) {
        document.getElementById("authModal").style.display = "none";
    }
});


const stars = document.querySelectorAll('.star');
let selectedRating = 0;

stars.forEach(star => {
    star.addEventListener('click', (e) => {
        const value = parseInt(e.target.dataset.value);
        selectedRating = value;
        
        stars.forEach((s, index) => {
            s.classList.toggle('active', index < value);
        });
    });
});


document.getElementById("reviewForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
        alert("Для отправки отзыва необходимо авторизоваться");
        return;
    }

    if (selectedRating === 0) {
        alert("Пожалуйста, выберите оценку");
        return;
    }

    const reviewData = {
        productID: productId,
        userId: currentUser.user_id,
        grade: selectedRating,
        content: document.getElementById("reviewText").value.trim(),
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch('http://localhost:50055/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });

        if (response.ok) {
            loadReviews();
            document.getElementById("reviewForm").reset();
            stars.forEach(s => s.classList.remove('active'));
            selectedRating = 0;
        }
    } catch (error) {
        console.error("Ошибка при отправке отзыва:", error);
    }
});


async function loadReviews() {
    try {
        const response = await fetch(`http://localhost:50055/reviews?productId=${productId}`);
        const reviews = await response.json();
        console.log(reviews)
        const reviewsList = document.getElementById("reviewsList");
        reviewsList.innerHTML = reviews.reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${review.name}</span>
                    <div class="review-rating">
                        ${'★'.repeat(review.grade).padEnd(5, '☆')}
                    </div>
                    <span class="review-date">${new Date(review.timestamp).toLocaleDateString()}</span>
                </div>
                <p>${review.content}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error("Ошибка загрузки отзывов:", error);
    }
}


if (productId) {
    loadReviews();
}

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "auth.html";
        return;
    }

    const productID = productId; 
    const response = await fetch(`http://localhost:50052/product/${productID}`);
    if (!response.ok) {
        console.error("Ошибка загрузки товара");
        return;
    }

    const product = await response.json();
    const totalAmount = (product.price / 41.06).toFixed(2); 
    
    

    paypal.Buttons({
        createOrder: async () => {
            return fetch("http://localhost:50056/paypal/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productID: productId,
                    amount: parseFloat(totalAmount),
                    buyerID: currentUser.user_id
                })
            })
            .then(res => res.json())
            .then(data => {
                console.log("Создан заказ:", data);
                if (!data.paypal_order) throw new Error("Order ID не получен!");
                return data.paypal_order; 
            })
            .catch(error => {
                console.error("Ошибка создания заказа:", error);
                throw error;
            });
        },
        onApprove: async (data) => {
            console.log("Оплата одобрена:", data);
    
            return fetch("http://localhost:50056/paypal/capture-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_id: data.paymentID,
                    paypal_order_id: data.orderID
                 }) 
            })
            .then(res => res.json())
            .then(response => {
                alert("Оплата успешна!");
                console.log("Ответ capture-order:", response);
            })
            .catch(error => console.error("Ошибка подтверждения:", error));
        },
        onError: (err) => {
            console.error("PayPal error:", err);
        }
    }).render("#paypal-button-container");

}); 

