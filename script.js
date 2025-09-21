// Data produk (disimpan di localStorage)
let products = JSON.parse(localStorage.getItem('products')) || [
    { id: 1, name: 'Buku Tulis', code: 'BT001', price: 5000, stock: 50 },
    { id: 2, name: 'Pensil 2B', code: 'PN002', price: 2000, stock: 100 },
    { id: 3, name: 'Penghapus', code: 'PH003', price: 1500, stock: 80 },
    { id: 4, name: 'Penggaris', code: 'PG004', price: 3000, stock: 40 },
    { id: 5, name: 'Spidol', code: 'SP005', price: 7000, stock: 30 },
    { id: 6, name: 'Stapler', code: 'ST006', price: 15000, stock: 20 }
];

// Keranjang belanja
let cart = JSON.parse(localStorage.getItem('cart')) || [];

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

// Fungsi untuk menyimpan data ke localStorage
function saveToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('cart', JSON.stringify(cart));
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

// Load produk ke grid
function loadProducts() {
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        if (product.stock > 0) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <div class="code">${product.code}</div>
                <div class="price">${formatRupiah(product.price)}</div>
                <div class="stock">Stok: ${product.stock}</div>
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
searchProductInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    productsGrid.innerHTML = '';
    
    products.filter(product => {
        return product.name.toLowerCase().includes(searchTerm) || 
               product.code.toLowerCase().includes(searchTerm);
    }).forEach(product => {
        if (product.stock > 0) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <div class="code">${product.code}</div>
                <div class="price">${formatRupiah(product.price)}</div>
                <div class="stock">Stok: ${product.stock}</div>
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
});

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
    
    saveToLocalStorage();
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
                    <span>${item.quantity</span>
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
        saveToLocalStorage();
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
    
    saveToLocalStorage();
    updateCart();
}

// Hapus item dari keranjang
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveToLocalStorage();
    updateCart();
    showToast('Produk dihapus dari keranjang');
}

// Kosongkan keranjang
clearCartBtn.addEventListener('click', function() {
    if (cart.length > 0) {
        if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
            cart = [];
            saveToLocalStorage();
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

// Tutup modal
closeModalButtons.forEach(button => {
    button.addEventListener('click', function() {
        productsModal.style.display = 'none';
        checkoutModal.style.display = 'none';
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
        productItem.innerHTML = `
            <div class="admin-product-info">
                <div class="admin-product-name">${product.name}</div>
                <div class="admin-product-details">
                    Kode: ${product.code} | Harga: ${formatRupiah(product.price)} | Stok: ${product.stock}
                </div>
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
addProductForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const code = document.getElementById('product-code').value;
    const price = parseInt(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    
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
        stock
    });
    
    saveToLocalStorage();
    loadProducts();
    loadAdminProducts();
    
    // Reset form
    addProductForm.reset();
    
    showToast('Produk berhasil ditambahkan');
});

// Edit produk
function editProduct(productId) {
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
    
    saveToLocalStorage();
    loadProducts();
    loadAdminProducts();
    
    showToast('Produk berhasil diupdate');
}

// Hapus produk
function deleteProduct(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    
    // Hapus produk dari keranjang jika ada
    cart = cart.filter(item => item.id !== productId);
    
    // Hapus produk dari daftar
    products = products.filter(product => product.id !== productId);
    
    saveToLocalStorage();
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
confirmPaymentBtn.addEventListener('click', function() {
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
    
    // Simpan perubahan stok
    saveToLocalStorage();
    
    // Cetak struk (simulasi)
    alert('Pembayaran berhasil! Struk telah dicetak.');
    
    // Reset keranjang
    cart = [];
    saveToLocalStorage();
    updateCart();
    
    // Tutup modal
    checkoutModal.style.display = 'none';
    
    // Reload produk untuk update stok
    loadProducts();
    
    showToast('Transaksi berhasil diselesaikan');
});

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCart();
});
