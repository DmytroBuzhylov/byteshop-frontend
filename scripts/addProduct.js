const token = localStorage.getItem("token");
const userID = getUserIdFromToken(token);

document.querySelectorAll('input[name="delivery-type"]').forEach(radio => {
    radio.addEventListener('change', function () {
        document.getElementById('keys-section').style.display = this.value === 'key' ? 'block' : 'none';
        document.getElementById('link-section').style.display = this.value === 'link' ? 'block' : 'none';
    });
});

document.getElementById('add-product-form').addEventListener('submit', function (e) {
    e.preventDefault();

    if (!userID) {
        alert('Ошибка: пользователь не авторизован');
        return;
    }

    // Проверка цены
    const price = parseFloat(document.getElementById('product-price').value);
    if (price > 1000000) {
        alert('Цена не может превышать 1 000 000');
        return;
    }

    
    const formData = new FormData(this);
    formData.append('user_id', userID);
    
    formData.append('category', document.getElementById('product-category').value);
    console.log(formData)
    
    fetch('http://localhost:50052/products/add-product', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        alert('Товар успешно добавлен!');
        this.reset();
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при добавлении товара.');
    });
});


function getUserIdFromToken(token) {
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1])); 
        return payload.user_id; 
    } catch (error) {
        console.error('Ошибка декодирования JWT:', error);
        return null;
    }
}


