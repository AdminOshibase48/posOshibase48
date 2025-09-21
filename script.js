document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const appContainer = document.getElementById('app-container');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginMessage = document.getElementById('login-message');
    const logoutBtn = document.getElementById('logout-btn');
    const cashierSection = document.getElementById('cashier-section');
    const managementSection = document.getElementById('management-section');
    const showCashierBtn = document.getElementById('show-cashier-btn');
    const showManagementBtn = document.getElementById('show-management-btn');
    const itemGrid = document.getElementById('item-grid');
    const cartList = document.getElementById('cart-list');
    const totalPriceSpan = document.getElementById('total-price');
    const resetCartBtn = document.getElementById('reset-cart-btn');
    
    let cart = [];

    // Data dummy untuk barang
    const items = [
        { id: 1, name: 'Buku Tulis', stock: 50, price: 10000 },
        { id: 2, name: 'Pensil 2B', stock: 100, price: 5000 },
        { id: 3, name: 'Penghapus', stock: 75, price: 3000 },
        { id: 4, name: 'Spidol', stock: 40, price: 8000 },
        { id: 5, name: 'Pulpen', stock: 60, price: 7000 },
        { id: 6, name: 'Stapler', stock: 20, price: 25000 },
        { id: 7, name: 'Isi Staples', stock: 90, price: 2000 },
        { id: 8, name: 'Gunting', stock: 30, price: 15000 },
    ];

    // Fungsi untuk menampilkan halaman
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }

    // Fungsi untuk menampilkan section
    function showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
    }

    // Fungsi untuk render daftar barang di grid
    function renderItemGrid() {
        itemGrid.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-price">Rp ${item.price.toLocaleString('id-ID')}</div>
            `;
            card.addEventListener('click', () => addItemToCart(item));
            itemGrid.appendChild(card);
        });
    }

    // Fungsi untuk menambah barang ke keranjang
    function addItemToCart(item) {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        renderCart();
    }

    // Fungsi untuk render keranjang belanja
    function renderCart() {
        cartList.innerHTML = '';
        let total = 0;
        cart.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} (${item.quantity})</span>
                <span>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
            `;
            cartList.appendChild(li);
            total += item.price * item.quantity;
        });
        totalPriceSpan.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    }

    // Menangani form login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'admin' && password === 'admin123') {
            loginModal.classList.remove('active');
            appContainer.classList.add('visible');
            loginMessage.textContent = '';
            renderItemGrid(); // Render daftar barang setelah login
        } else {
            loginMessage.textContent = 'Username atau password salah.';
        }
    });

    // Menangani logout
    logoutBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
        appContainer.classList.remove('visible');
        loginForm.reset();
    });

    // Menangani navigasi
    showCashierBtn.addEventListener('click', () => {
        showSection('cashier-section');
        showCashierBtn.classList.add('active');
        showManagementBtn.classList.remove('active');
    });

    showManagementBtn.addEventListener('click', () => {
        showSection('management-section');
        showManagementBtn.classList.add('active');
        showCashierBtn.classList.remove('active');
    });

    // Reset keranjang
    resetCartBtn.addEventListener('click', () => {
        cart = [];
        renderCart();
    });

    // Mulai dengan menampilkan modal login
    loginModal.classList.add('active');
});
