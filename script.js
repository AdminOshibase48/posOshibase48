// Data produk (disimpan di localStorage dan Firebase)
let products = [];
let cart = [];
let transactions = [];

// Elemen DOM
const productsGrid = document.getElementById('products-grid');
const searchProductInput = document.getElementById('search-product');
const cartItems = document.getElementById('cart-items');
const subtotalElement = document.getElementById('subtotal');
const taxElement = document.getElementById('tax');
const totalElement = document.getElementById('total');
const clearCartBtn = document.getElementById('clear-cart');
const checkoutBtn = document.getElementById('checkout');
const manageProductsBtn = document.getElementById('manage-products-btn');
const productsModal = document.getElementById('products-modal');
const checkoutModal = document.getElementById('checkout-modal');
const closeModalButtons = document.querySelectorAll('.close');
const adminProductsList = document.getElementById('admin-products-list');
const addProductForm = document.getElementById('add-product-form');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const cashAmountInput = document.getElementById('cash-amount');
const changeAmountElement = document.getElementById('change-amount');
const checkoutTotalElement = document.getElementById('checkout-total');
const confirmPaymentBtn = document.getElementById('confirm-payment');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const historyDateFilter = document.getElementById('history-date');
const applyFilterBtn = document.getElementById('apply-filter');

// Fungsi untuk inisialisasi data
async function initializeData() {
    try {
        // Coba ambil data dari Firebase
        const snapshot = await database.ref('products').once('value');
        const firebaseProducts = snapshot.val();
        
        if (firebaseProducts && firebaseProducts.length > 0) {
            // Gunakan data dari Firebase
            products = firebaseProducts;
            localStorage.setItem('products', JSON.stringify(products));
            showToast('Data produk disinkronisasi dari cloud');
        } else {
            // Gunakan data default jika Firebase kosong
            products = JSON.parse(localStorage.getItem('products')) || [
                { id: 1, name: 'Buku Tulis', code: 'BT001', price: 5000, stock: 50 },
                { id: 2, name: 'Pensil 2B', code: 'PN002', price: 2000, stock: 100 },
                { id: 3, name: 'Penghapus', code: 'PH003', price: 1500, stock: 80 },
                { id: 4, name: 'Penggaris', code: 'PG004', price: 3000, stock: 40 },
                { id: 5, name: 'Spidol', code: 'SP005', price: 7000, stock: 30 },
                { id: 6, name: 'Stapler', code: 'ST006', price: 15000, stock: 20 }
            ];
            
            // Simpan ke Firebase
            await database.ref('products').set(products);
        }
        
        // Load cart dan transactions dari localStorage
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        // Load data ke UI
        loadProducts();
        updateCart();
        
        // Setup listener untuk perubahan data dari perangkat lain
        setupRealtimeListeners();
        
    } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback ke localStorage jika Firebase error
        products = JSON.parse(localStorage.getItem('products')) || [
            { id: 1, name: 'Buku Tulis', code: 'BT001', price: 5000, stock: 50 },
            { id: 2, name: 'Pensil 2B', code: 'PN002', price: 2000, stock: 100 },
            { id: 3, name: 'Penghapus', code: 'PH003', price: 1500, stock: 80 },
            { id: 4, name: 'Penggaris', code: 'PG004', price: 3000, stock: 40 },
            { id: 5, name: 'Spidol', code: 'SP005', price: 7000, stock: 30 },
            { id: 6, name: 'Stapler', code: 'ST006', price: 15000, stock: 20 }
        ];
        loadProducts();
        updateCart();
    }
}

// Setup listener untuk perubahan realtime
function setupRealtimeListeners() {
    // Listener untuk produk
    database.ref('products').on('value', (snapshot) => {
        const firebaseProducts = snapshot.val();
        if (firebaseProducts && firebaseProducts.length > 0) {
            products = firebaseProducts;
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
            showToast('Data produk diperbarui dari cloud');
        }
    });
}

// Fungsi untuk menyimpan data ke localStorage dan Firebase
async function saveToStorage() {
    try {
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Simpan produk ke Firebase
        await database.ref('products').set(products);
        
        // Simpan transactions ke Firebase
        await database.ref('transactions').set(transactions);
    } catch (error) {
        console.error('Error saving to Firebase:', error);
    }
}

// Format angka ke Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Tampilkan notifikasi toast
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Load produk ke grid (Realtime)
function loadProducts() {
    productsGrid.innerHTML = '';
    
    const searchTerm = searchProductInput.value.toLowerCase();
    
    const filteredProducts = products.filter(product => {
        return product.name.toLowerCase().includes(searchTerm) || 
               product.code.toLowerCase().includes(searchTerm);
    });
    
    filteredProducts.forEach(product => {
        if (product.stock > 0) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Tambahkan gambar jika ada
            const imageHTML = product.image 
                ? `<div class="product-image-container"><img src="${product.image}" alt="${product.name}" class="product-image"></div>`
                : `<div class="product-image-container"><div class="product-image-placeholder"><i class="fas fa-image"></i></div></div>`;
            
            productCard.innerHTML = `
                ${imageHTML}
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="code">${product.code}</div>
                    <div class="price">${formatRupiah(product.price)}</div>
                    <div class="stock">Stok: ${product.stock}</div>
                </div>
                <button class="add-to-cart" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Tambah
                </button>
            `;
            productsGrid.appendChild(productCard);
        }
    });
    
    // Tambah event listener untuk tombol tambah ke keranjang
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            addToCart(productId);
        });
    });
}

// Cari produk
searchProductInput.addEventListener('input', loadProducts);

// Tambah produk ke keranjang
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    // Cek apakah produk sudah ada di keranjang
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
            showToast(`${product.name} ditambahkan ke keranjang`);
        } else {
            alert('Stok tidak cukup!');
            return;
        }
    } else {
        if (product.stock > 0) {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            });
            showToast(`${product.name} ditambahkan ke keranjang`);
        } else {
            alert('Stok habis!');
            return;
        }
    }
    
    saveToStorage();
    updateCart();
}

// Update tampilan keranjang
function updateCart() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Keranjang belanja kosong</div>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatRupiah(item.price)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item-total">${formatRupiah(item.price * item.quantity)}</div>
                <button class="remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    // Hitung total
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // Pajak 10%
    const total = subtotal + tax;
    
    subtotalElement.textContent = formatRupiah(subtotal);
    taxElement.textContent = formatRupiah(tax);
    totalElement.textContent = formatRupiah(total);
    
    // Tambah event listener untuk tombol kuantitas
    document.querySelectorAll('.increase').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            increaseQuantity(productId);
        });
    });
    
    document.querySelectorAll('.decrease').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            decreaseQuantity(productId);
        });
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            removeFromCart(productId);
        });
    });
}

// Tambah kuantitas item
function increaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item.quantity < product.stock) {
        item.quantity += 1;
        saveToStorage();
        updateCart();
    } else {
        alert('Stok tidak cukup!');
    }
}

// Kurangi kuantitas item
function decreaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        removeFromCart(productId);
        return;
    }
    
    saveToStorage();
    updateCart();
}

// Hapus item dari keranjang
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveToStorage();
    updateCart();
    showToast('Produk dihapus dari keranjang');
}

// Kosongkan keranjang
clearCartBtn.addEventListener('click', function() {
    if (cart.length > 0) {
        if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
            cart = [];
            saveToStorage();
            updateCart();
            showToast('Keranjang dikosongkan');
        }
    }
});

// Checkout
checkoutBtn.addEventListener('click', function() {
    if (cart.length === 0) {
        alert('Keranjang belanja kosong!');
        return;
    }
    
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    checkoutTotalElement.textContent = formatRupiah(total);
    cashAmountInput.value = '';
    changeAmountElement.textContent = formatRupiah(0);
    
    checkoutModal.style.display = 'block';
});

// Kelola produk
manageProductsBtn.addEventListener('click', function() {
    loadAdminProducts();
    productsModal.style.display = 'block';
});

// Tombol History
historyBtn.addEventListener('click', function() {
    loadHistory();
    historyModal.style.display = 'block';
});

// Filter History
applyFilterBtn.addEventListener('click', loadHistory);

// Load History Transaksi
function loadHistory() {
    historyList.innerHTML = '';
    
    let filteredTransactions = transactions;
    
    // Filter berdasarkan tanggal jika ada
    if (historyDateFilter.value) {
        filteredTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.timestamp).toLocaleDateString('id-ID');
            const filterDate = new Date(historyDateFilter.value).toLocaleDateString('id-ID');
            return transactionDate === filterDate;
        });
    }
    
    if (filteredTransactions.length === 0) {
        historyList.innerHTML = '<div class="empty-history">Tidak ada riwayat transaksi</div>';
        return;
    }
    
    // Urutkan dari yang terbaru
    filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
