const ip = "192.168.50.142"

document.querySelector('.navbar-toggle').addEventListener('click', () => {
    document.querySelector('.navbar-menu').classList.toggle('active');
});


document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
    });
});

const token = localStorage.getItem('token');
if (token) {
    document.getElementById('loginButton').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'block';
} else {
    document.getElementById('loginButton').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'none';
}

document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');  
    window.location.reload();  
});


fetch(`http://${ip}:50052/products`)
    .then(response => response.json())
    .then(products => {
        if (!products || products.length === 0) {
            console.error("Нет товаров для отображения.");
            return;
        }

        const productGrid = document.querySelector(".product-grid");
        if (!productGrid) return;

        productGrid.innerHTML = ""; 
        
        products.forEach(product => {
            const productCard = `
                <div class="product-card">
                    <img src="http://${ip}:50052${product.imageURL}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <div class="price">${product.price} ГРН</div>
                    <button class="glow-button" onclick="location.href='product.html?id=${product.productID}'">Подробнее</button>
                </div>
            `;
            productGrid.innerHTML += productCard;
        });
    })
    .catch(error => {
        console.error("Ошибка загрузки товаров:", error);
    });

    document.querySelectorAll('.category-link').forEach(category => {
        category.addEventListener('click', function (e) {
            e.preventDefault();
            const selectedCategory = this.dataset.category; 
            loadProductsByCategory(selectedCategory); 
        });
    });

    function loadProductsByCategory(category) {
        fetch(`http://${ip}:50052/products/${category}`)
            .then(response => response.json())
            .then(products => {
                const productGrid = document.querySelector(".product-grid");
                if (!productGrid) return;
    
                productGrid.innerHTML = ""; 
    
                if (!products || products.length === 0) {
                    productGrid.innerHTML = "<p>Товары не найдены</p>";
                    return;
                }
    
                products.forEach(product => {
                    const productCard = `
                        <div class="product-card">
                            <img src="http://${ip}:50052${product.imageURL}" alt="${product.name}">
                            <h3>${product.name}</h3>
                            <div class="price">${product.price} ГРН</div>
                            <button class="glow-button" onclick="location.href='product.html?id=${product.productID}'">Подробнее</button>
                        </div>
                    `;
                    productGrid.innerHTML += productCard;
                });
            })
            .catch(error => {
                console.error("Ошибка загрузки товаров:", error);
            });
    }






async function checkAdminRights() {
    if (!token) return false;

    try {
        const response = await fetch(`http://${ip}:50051/auth/admin`, {
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

checkAdminRights().then(isAdmin => {
    if(isAdmin) {
        document.getElementById('adminLink').style.display = 'block';
    }
});