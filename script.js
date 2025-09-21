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
    
    filteredTransactions.forEach(transaction => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const transactionDate = new Date(transaction.timestamp);
        const formattedDate = transactionDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let itemsHTML = '';
        transaction.items.forEach(item => {
            itemsHTML += `
                <div class="history-product">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${formatRupiah(item.price * item.quantity)}</span>
                </div>
            `;
        });
        
        historyItem.innerHTML = `
            <div class="history-header">
                <div class="history-id">Transaksi #${transaction.id}</div>
                <div class="history-date">${formattedDate}</div>
            </div>
            <div class="history-details">
                <div class="history-products">
                    ${itemsHTML}
                </div>
                <div class="history-summary">
                    <div class="history-subtotal">
                        <span>Subtotal:</span>
                        <span>${formatRupiah(transaction.subtotal)}</span>
                    </div>
                    <div class="history-tax">
                        <span>Pajak (10%):</span>
                        <span>${formatRupiah(transaction.tax)}</span>
                    </div>
                    <div class="history-total">
                        <span>Total:</span>
                        <span>${formatRupiah(transaction.total)}</span>
                    </div>
                    <div class="history-cash">
                        <span>Tunai:</span>
                        <span>${formatRupiah(transaction.cash)}</span>
                    </div>
                    <div class="history-change">
                        <span>Kembalian:</span>
                        <span>${formatRupiah(transaction.change)}</span>
                    </div>
                </div>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Tutup modal
closeModalButtons.forEach(button => {
    button.addEventListener('click', function() {
        productsModal.style.display = 'none';
        checkoutModal.style.display = 'none';
        historyModal.style.display = 'none';
    });
});

// Tutup modal ketika klik di luar modal
window.addEventListener('click', function(e) {
    if (e.target === productsModal) {
        productsModal.style.display = 'none';
    }
    if (e.target === checkoutModal) {
        checkoutModal.style.display = 'none';
    }
    if (e.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

// Fungsi tab
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Nonaktifkan semua tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Aktifkan tab yang dipilih
        this.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Load produk untuk admin
function loadAdminProducts() {
    adminProductsList.innerHTML = '';
    
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'admin-product-item';
        
        // Tambahkan gambar jika ada
        const imageHTML = product.image 
            ? `<div class="admin-product-image"><img src="${product.image}" alt="${product.name}"></div>`
            : `<div class="admin-product-image-placeholder"><i class="fas fa-image"></i></div>`;
        
        productItem.innerHTML = `
            ${imageHTML}
            <div class="admin-product-details">
                <div class="admin-product-name">${product.name}</div>
                <div>Kode: ${product.code} | Harga: ${formatRupiah(product.price)} | Stok: ${product.stock}</div>
            </div>
            <div class="admin-product-actions">
                <button class="edit-product" data-id="${product.id}">Edit</button>
                <button class="delete-product" data-id="${product.id}">Hapus</button>
            </div>
        `;
        adminProductsList.appendChild(productItem);
    });
    
    // Tambah event listener untuk tombol edit dan hapus
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            deleteProduct(productId);
        });
    });
}

// Tambah produk baru
addProductForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const code = document.getElementById('product-code').value;
    const price = parseInt(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    
    // Ambil gambar jika ada
    let imageData = null;
    const imagePreview = document.querySelector('#image-preview img');
    if (imagePreview) {
        imageData = imagePreview.src;
    }
    
    // Cek apakah kode produk sudah ada
    if (products.some(product => product.code === code)) {
        alert('Kode produk sudah ada!');
        return;
    }
    
    // Generate ID baru
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    // Tambah produk baru
    products.push({
        id: newId,
        name,
        code,
        price,
        stock,
        image: imageData
    });
    
    await saveToStorage();
    loadProducts();
    loadAdminProducts();
    
    // Reset form
    this.reset();
    document.getElementById('image-preview').innerHTML = `
        <i class="fas fa-image"></i>
        <span>Pratinjau gambar akan muncul di sini</span>
    `;
    
    showToast('Produk berhasil ditambahkan');
});

// Edit produk
async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const newName = prompt('Masukkan nama baru:', product.name);
    if (!newName) return;
    
    const newCode = prompt('Masukkan kode baru:', product.code);
    if (!newCode) return;
    
    // Cek apakah kode produk sudah ada (kecuali untuk produk ini)
    if (products.some(p => p.code === newCode && p.id !== productId)) {
        alert('Kode produk sudah digunakan!');
        return;
    }
    
    const newPrice = parseInt(prompt('Masukkan harga baru:', product.price));
    if (isNaN(newPrice)) return;
    
    const newStock = parseInt(prompt('Masukkan stok baru:', product.stock));
    if (isNaN(newStock)) return;
    
    // Update produk
    product.name = newName;
    product.code = newCode;
    product.price = newPrice;
    product.stock = newStock;
    
    await saveToStorage();
    loadProducts();
    loadAdminProducts();
    
    showToast('Produk berhasil diupdate');
}

// Hapus produk
async function deleteProduct(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    
    // Hapus produk dari keranjang jika ada
    cart = cart.filter(item => item.id !== productId);
    
    // Hapus produk dari daftar
    products = products.filter(product => product.id !== productId);
    
    await saveToStorage();
    loadProducts();
    loadAdminProducts();
    updateCart();
    
    showToast('Produk berhasil dihapus');
}

// Hitung kembalian
cashAmountInput.addEventListener('input', function() {
    const cashAmount = parseInt(this.value) || 0;
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    const change = cashAmount - total;
    
    if (change >= 0) {
        changeAmountElement.textContent = formatRupiah(change);
    } else {
        changeAmountElement.textContent = formatRupiah(0);
    }
});

// Konfirmasi pembayaran
confirmPaymentBtn.addEventListener('click', async function() {
    const cashAmount = parseInt(cashAmountInput.value) || 0;
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    if (cashAmount < total) {
        alert('Jumlah uang tidak cukup!');
        return;
    }
    
    // Kurangi stok produk
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.quantity;
        }
    });
    
    // Simpan transaksi ke history
    const transaction = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        items: [...cart],
        subtotal: subtotal,
        tax: tax,
        total: total,
        cash: cashAmount,
        change: cashAmount - total
    };
    
    transactions.push(transaction);
    
    // Simpan perubahan
    await saveToStorage();
    
    // Cetak struk (simulasi)
    alert('Pembayaran berhasil! Struk telah dicetak.');
    
    // Reset keranjang
    cart = [];
    await saveToStorage();
    updateCart();
    
    // Tutup modal
    checkoutModal.style.display = 'none';
    
    // Reload produk untuk update stok
    loadProducts();
    
    showToast('Transaksi berhasil diselesaikan');
});

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
});
