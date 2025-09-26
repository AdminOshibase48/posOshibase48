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
const historyDateFilter = document.getElementById('history-date');
const applyFilterBtn = document.getElementById('apply-filter');
const clearHistoryBtn = document.getElementById('clear-history');

// Elemen DOM tambahan untuk fitur baru
const cashButtons = document.querySelectorAll('.cash-btn');
const cashError = document.getElementById('cash-error');

// Modal untuk mengubah barang
const editItemModal = document.getElementById('edit-item-modal');
const editItemForm = document.getElementById('edit-item-form');
const editProductName = document.getElementById('edit-product-name');
const editProductPrice = document.getElementById('edit-product-price');
const editProductQuantity = document.getElementById('edit-product-quantity');
const editProductMaxStock = document.getElementById('edit-product-max-stock');
const editProductId = document.getElementById('edit-product-id');
const cancelEditBtn = document.getElementById('cancel-edit');
const saveEditBtn = document.getElementById('save-edit');

// Modal Manager Class
class ModalManager {
    constructor() {
        this.initModals();
    }

    initModals() {
        // History Modal
        const historyBtn = document.getElementById('history-btn');
        const historyModal = document.getElementById('history-modal');
        const historyClose = historyModal.querySelector('.close');

        historyBtn.addEventListener('click', () => {
            this.openModal('history-modal');
            this.loadHistory();
        });

        historyClose.addEventListener('click', () => {
            this.closeModal('history-modal');
        });

        // Products Modal
        const productsBtn = document.getElementById('manage-products-btn');
        const productsModal = document.getElementById('products-modal');
        const productsClose = productsModal.querySelector('.close');

        productsBtn.addEventListener('click', () => {
            this.openModal('products-modal');
            this.loadAdminProducts();
        });

        productsClose.addEventListener('click', () => {
            this.closeModal('products-modal');
        });

        // Checkout Modal
        const checkoutBtn = document.getElementById('checkout');
        const checkoutModal = document.getElementById('checkout-modal');
        const checkoutClose = checkoutModal.querySelector('.close');

        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                this.showToast('Keranjang belanja kosong!', 'error');
                return;
            }
            this.openCheckoutModal();
        });

        checkoutClose.addEventListener('click', () => {
            this.closeModal('checkout-modal');
        });

        // Edit Item Modal
        const editClose = editItemModal.querySelector('.close');
        editClose.addEventListener('click', () => {
            this.closeModal('edit-item-modal');
        });

        cancelEditBtn.addEventListener('click', () => {
            this.closeModal('edit-item-modal');
        });

        // Setup edit item form
        this.setupEditItemForm();

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Tab functionality for products modal
        this.initTabs();
    }

    setupEditItemForm() {
        saveEditBtn.addEventListener('click', () => {
            this.saveEditedItem();
        });

        // Allow Enter key to save
        editItemForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveEditedItem();
            }
        });

        // Validate quantity input
        editProductQuantity.addEventListener('input', () => {
            this.validateEditQuantity();
        });
    }

    validateEditQuantity() {
        const quantity = parseInt(editProductQuantity.value);
        const maxStock = parseInt(editProductMaxStock.value);
        
        if (quantity > maxStock) {
            editProductQuantity.value = maxStock;
            this.showToast(`Stok tersedia hanya ${maxStock}`, 'info');
        } else if (quantity < 1) {
            editProductQuantity.value = 1;
        }
    }

    openEditItemModal(productId) {
        const cartItem = cart.find(item => item.id === productId);
        const product = products.find(p => p.id === productId);

        if (!cartItem || !product) {
            this.showToast('Produk tidak ditemukan!', 'error');
            return;
        }

        // Isi form dengan data produk
        editProductId.value = productId;
        editProductName.value = cartItem.name;
        editProductPrice.value = cartItem.price;
        editProductQuantity.value = cartItem.quantity;
        editProductMaxStock.value = product.stock + cartItem.quantity; // Stok tersisa + quantity di cart

        // Update max attribute untuk input quantity
        editProductQuantity.max = product.stock + cartItem.quantity;
        editProductQuantity.min = 1;

        this.openModal('edit-item-modal');
        editProductQuantity.focus();
    }

    saveEditedItem() {
        const productId = parseInt(editProductId.value);
        const newQuantity = parseInt(editProductQuantity.value);
        
        if (!productId || !newQuantity || newQuantity < 1) {
            this.showToast('Quantity tidak valid!', 'error');
            return;
        }

        const cartItem = cart.find(item => item.id === productId);
        const product = products.find(p => p.id === productId);

        if (!cartItem || !product) {
            this.showToast('Produk tidak ditemukan!', 'error');
            return;
        }

        // Validasi stok
        const maxAvailable = product.stock + cartItem.quantity; // Stok saat ini + quantity yang sudah di cart
        if (newQuantity > maxAvailable) {
            this.showToast(`Stok tidak mencukupi! Maksimal: ${maxAvailable}`, 'error');
            return;
        }

        // Simpan perubahan
        cartItem.quantity = newQuantity;

        // Jika quantity 0, hapus dari keranjang
        if (newQuantity === 0) {
            cart = cart.filter(item => item.id !== productId);
            this.showToast('Produk dihapus dari keranjang');
        } else {
            this.showToast(`Quantity ${cartItem.name} diubah menjadi ${newQuantity}`);
        }

        saveToStorage();
        updateCart();
        this.closeModal('edit-item-modal');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }

    openCheckoutModal() {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        checkoutTotalElement.textContent = formatRupiah(total);
        cashAmountInput.value = '';
        changeAmountElement.textContent = formatRupiah(0);
        cashError.style.display = 'none';

        this.openModal('checkout-modal');
    }

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');

                // Remove active class from all tabs
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                // Add active class to clicked tab
                btn.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });
    }

    async loadHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '<div class="empty-history"><i class="fas fa-spinner fa-spin"></i><h3>Memuat riwayat...</h3></div>';

        try {
            // Cek apakah transactions adalah array atau object
            let transactionsData = transactions;

            // Jika transactions adalah object, convert ke array
            if (transactions && typeof transactions === 'object' && !Array.isArray(transactions)) {
                transactionsData = Object.values(transactions);
            }

            if (!transactionsData || transactionsData.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-history">
                        <i class="fas fa-receipt"></i>
                        <h3>Belum ada riwayat transaksi</h3>
                        <p>Transaksi yang telah dilakukan akan muncul di sini</p>
                    </div>
                `;
                return;
            }

            let filteredTransactions = [...transactionsData];

            // Filter berdasarkan tanggal jika ada
            if (historyDateFilter.value) {
                filteredTransactions = transactionsData.filter(transaction => {
                    const transactionDate = new Date(transaction.timestamp).toLocaleDateString('id-ID');
                    const filterDate = new Date(historyDateFilter.value).toLocaleDateString('id-ID');
                    return transactionDate === filterDate;
                });
            }

            if (filteredTransactions.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-history">
                        <i class="fas fa-search"></i>
                        <h3>Tidak ada transaksi pada tanggal ini</h3>
                        <p>Coba pilih tanggal lain atau lihat semua transaksi</p>
                    </div>
                `;
                return;
            }

            // Urutkan dari yang terbaru
            filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            let historyHTML = '';
            filteredTransactions.forEach((transaction, index) => {
                historyHTML += this.createHistoryItem(transaction, index);
            });

            historyList.innerHTML = historyHTML;

            // Add event listeners for delete buttons
            this.attachHistoryEventListeners();

        } catch (error) {
            console.error('Error loading history:', error);
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Gagal memuat riwayat</h3>
                    <p>Silakan coba lagi</p>
                </div>
            `;
        }
    }

    createHistoryItem(transaction, index) {
        const date = new Date(transaction.timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const transactionId = transaction.id || `T${Date.now()}${index}`;

        const productsHTML = transaction.items ? transaction.items.map(item => `
            <div class="history-product">
                <div>
                    <div class="history-product-name">${item.name || 'Produk'}</div>
                    <div class="history-product-details">${item.quantity || 0} x Rp ${(item.price || 0).toLocaleString()}</div>
                </div>
                <div>Rp ${((item.quantity || 0) * (item.price || 0)).toLocaleString()}</div>
            </div>
        `).join('') : '<div class="history-product">Tidak ada item</div>';

        return `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-id">Transaksi #${transactionId.toString().substring(0, 8)}</div>
                    <div class="history-date">${date}</div>
                </div>
                <div class="history-details">
                    <div class="history-products">
                        ${productsHTML}
                    </div>
                    <div class="history-summary">
                        <div class="history-subtotal">
                            <span>Subtotal:</span>
                            <span>Rp ${(transaction.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div class="history-tax">
                            <span>Pajak (10%):</span>
                            <span>Rp ${(transaction.tax || 0).toLocaleString()}</span>
                        </div>
                        <div class="history-total">
                            <span>Total:</span>
                            <span>Rp ${(transaction.total || 0).toLocaleString()}</span>
                        </div>
                        <div class="history-cash">
                            <span>Bayar:</span>
                            <span>Rp ${(transaction.cash || 0).toLocaleString()}</span>
                        </div>
                        <div class="history-change">
                            <span>Kembali:</span>
                            <span>Rp ${(transaction.change || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn-danger delete-transaction" data-id="${transactionId}">
                        <i class="fas fa-trash"></i> Hapus Transaksi
                    </button>
                </div>
            </div>
        `;
    }

    attachHistoryEventListeners() {
        document.querySelectorAll('.delete-transaction').forEach(button => {
            button.addEventListener('click', (e) => {
                const transactionId = e.target.closest('.delete-transaction').getAttribute('data-id');
                this.deleteTransaction(transactionId);
            });
        });
    }

    async deleteTransaction(transactionId) {
        if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

        try {
            // Hapus dari array transactions
            transactions = transactions.filter(transaction => {
                const id = transaction.id || transaction.key;
                return id != transactionId;
            });

            // Simpan ke localStorage
            localStorage.setItem('transactions', JSON.stringify(transactions));

            // Simpan ke Firebase
            await database.ref('transactions').set(transactions);

            // Reload history
            this.loadHistory();
            this.showToast('Transaksi berhasil dihapus');

        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showToast('Gagal menghapus transaksi', 'error');
        }
    }

    async clearAllHistory() {
        if (transactions.length === 0) {
            this.showToast('Tidak ada riwayat transaksi untuk dihapus!', 'info');
            return;
        }

        if (confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat transaksi? Tindakan ini tidak dapat dibatalkan.')) {
            try {
                transactions = [];
                localStorage.setItem('transactions', JSON.stringify(transactions));
                await database.ref('transactions').set([]);

                this.loadHistory();
                this.showToast('Semua riwayat transaksi telah dihapus');

            } catch (error) {
                console.error('Error clearing history:', error);
                this.showToast('Gagal menghapus riwayat', 'error');
            }
        }
    }

    showToast(message, type = 'success') {
        toastMessage.textContent = message;

        // Set color based on type
        if (type === 'error') {
            toast.style.background = '#e53e3e';
        } else if (type === 'info') {
            toast.style.background = '#3182ce';
        } else {
            toast.style.background = '#38a169';
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    loadAdminProducts() {
        // Implementation for admin products
        console.log('Loading admin products...');
    }
}

// Fungsi untuk inisialisasi data
async function initializeData() {
    try {
        // Coba ambil data dari Firebase
        const productsSnapshot = await database.ref('products').once('value');
        const transactionsSnapshot = await database.ref('transactions').once('value');

        const firebaseProducts = productsSnapshot.val();
        const firebaseTransactions = transactionsSnapshot.val();

        // Handle products data
        if (firebaseProducts) {
            // Convert object to array if needed
            if (Array.isArray(firebaseProducts)) {
                products = firebaseProducts;
            } else if (typeof firebaseProducts === 'object') {
                products = Object.values(firebaseProducts);
            }
            localStorage.setItem('products', JSON.stringify(products));
        } else {
            // Default products
            products = [
                { id: 1, name: 'Buku Tulis', code: 'BT001', price: 3500, stock: 50 },
                { id: 2, name: 'Pensil 2B', code: 'PN002', price: 2000, stock: 100 },
                { id: 3, name: 'Penghapus', code: 'PH003', price: 1500, stock: 80 },
                { id: 4, name: 'Penggaris', code: 'PG004', price: 3000, stock: 40 },
                { id: 5, name: 'Spidol', code: 'SP005', price: 7000, stock: 30 },
                { id: 6, name: 'Stapler', code: 'ST006', price: 15000, stock: 20 }
            ];
            await database.ref('products').set(products);
        }

        // Handle transactions data
        if (firebaseTransactions) {
            if (Array.isArray(firebaseTransactions)) {
                transactions = firebaseTransactions;
            } else if (typeof firebaseTransactions === 'object') {
                transactions = Object.values(firebaseTransactions);
            }
            localStorage.setItem('transactions', JSON.stringify(transactions));
        } else {
            transactions = [];
            await database.ref('transactions').set(transactions);
        }

        // Load cart dari localStorage
        cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Load data ke UI
        loadProducts();
        updateCart();

        // Setup listener untuk perubahan data dari perangkat lain
        setupRealtimeListeners();

    } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback ke localStorage jika Firebase error
        products = JSON.parse(localStorage.getItem('products')) || [
            { id: 1, name: 'Buku Tulis', code: 'BT001', price: 3500, stock: 50 },
            { id: 2, name: 'Pensil 2B', code: 'PN002', price: 2000, stock: 100 },
            { id: 3, name: 'Penghapus', code: 'PH003', price: 1500, stock: 80 },
            { id: 4, name: 'Penggaris', code: 'PG004', price: 3000, stock: 40 },
            { id: 5, name: 'Spidol', code: 'SP005', price: 7000, stock: 30 },
            { id: 6, name: 'Stapler', code: 'ST006', price: 15000, stock: 20 }
        ];
        transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        cart = JSON.parse(localStorage.getItem('cart')) || [];

        loadProducts();
        updateCart();
    }
}

// Setup listener untuk perubahan realtime
function setupRealtimeListeners() {
    // Listener untuk produk
    database.ref('products').on('value', (snapshot) => {
        const firebaseProducts = snapshot.val();
        if (firebaseProducts) {
            if (Array.isArray(firebaseProducts)) {
                products = firebaseProducts;
            } else if (typeof firebaseProducts === 'object') {
                products = Object.values(firebaseProducts);
            }
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
        }
    });

    // Listener untuk transaksi
    database.ref('transactions').on('value', (snapshot) => {
        const firebaseTransactions = snapshot.val();
        if (firebaseTransactions) {
            if (Array.isArray(firebaseTransactions)) {
                transactions = firebaseTransactions;
            } else if (typeof firebaseTransactions === 'object') {
                transactions = Object.values(firebaseTransactions);
            }
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }
    });
}

// Format angka ke Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Load produk ke grid
function loadProducts() {
    if (!productsGrid) return;

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

            productCard.innerHTML = `
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
if (searchProductInput) {
    searchProductInput.addEventListener('input', loadProducts);
}

// Tambah produk ke keranjang
function addToCart(productId) {
    const product = products.find(p => p.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
            window.modalManager.showToast(`${product.name} ditambahkan ke keranjang`);
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
            window.modalManager.showToast(`${product.name} ditambahkan ke keranjang`);
        } else {
            alert('Stok habis!');
            return;
        }
    }

    saveToStorage();
    updateCart();
}

// Update tampilan keranjang dengan fitur edit
function updateCart() {
    if (!cartItems) return;

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
                <div class="cart-item-actions">
                    <button class="edit-item" data-id="${item.id}" title="Edit jumlah">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-item" data-id="${item.id}" title="Hapus dari keranjang">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }

    // Hitung total
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    if (subtotalElement) subtotalElement.textContent = formatRupiah(subtotal);
    if (taxElement) taxElement.textContent = formatRupiah(tax);
    if (totalElement) totalElement.textContent = formatRupiah(total);

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

    // Tambah event listener untuk tombol edit
    document.querySelectorAll('.edit-item').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            window.modalManager.openEditItemModal(productId);
        });
    });
}

// Fungsi untuk menyimpan data
async function saveToStorage() {
    try {
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('transactions', JSON.stringify(transactions));

        await database.ref('products').set(products);
        await database.ref('transactions').set(transactions);
    } catch (error) {
        console.error('Error saving to Firebase:', error);
    }
}

// Fungsi kuantitas dan keranjang
function increaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);

    if (item.quantity < product.stock) {
        item.quantity += 1;
        saveToStorage();
        updateCart();
        window.modalManager.showToast(`${item.name} ditambahkan`);
    } else {
        alert('Stok tidak cukup!');
    }
}

function decreaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);

    if (item.quantity > 1) {
        item.quantity -= 1;
        saveToStorage();
        updateCart();
        window.modalManager.showToast(`${item.name} dikurangi`);
    } else {
        removeFromCart(productId);
        return;
    }
}

function removeFromCart(productId) {
    const item = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    saveToStorage();
    updateCart();
    window.modalManager.showToast(`${item.name} dihapus dari keranjang`);
}

// Kosongkan keranjang
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function() {
        if (cart.length > 0) {
            if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
                cart = [];
                saveToStorage();
                updateCart();
                window.modalManager.showToast('Keranjang dikosongkan');
            }
        }
    });
}

// Fitur pembayaran
if (cashButtons) {
    cashButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = parseInt(this.getAttribute('data-amount'));
            cashAmountInput.value = amount;
            calculateChange();
            cashError.style.display = 'none';
        });
    });
}

function calculateChange() {
    if (!cashAmountInput || !changeAmountElement) return;

    const cashAmount = parseInt(cashAmountInput.value) || 0;
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const change = cashAmount - total;

    if (change >= 0) {
        changeAmountElement.textContent = formatRupiah(change);
        if (cashError) cashError.style.display = 'none';
    } else {
        changeAmountElement.textContent = formatRupiah(0);
        if (cashError) cashError.style.display = 'flex';
    }
}

if (cashAmountInput) {
    cashAmountInput.addEventListener('input', calculateChange);
}

// Konfirmasi pembayaran
if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', async function() {
        const cashAmount = parseInt(cashAmountInput.value) || 0;
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        if (cashAmount < total) {
            if (cashError) cashError.style.display = 'flex';
            if (cashAmountInput) cashAmountInput.focus();
            return;
        }

        // Kurangi stok
        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                product.stock -= cartItem.quantity;
                if (product.stock < 0) product.stock = 0;
            }
        });

        // Buat transaksi
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

        try {
            await saveToStorage();
            printReceipt(transaction);

            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCart();

            window.modalManager.closeModal('checkout-modal');
            loadProducts();

            window.modalManager.showToast('Transaksi berhasil!');

        } catch (error) {
            console.error('Error:', error);
            alert('Error menyimpan transaksi.');
        }
    });
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modal manager first
    window.modalManager = new ModalManager();

    // Then initialize data
    initializeData();

    // Setup history filter button
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            window.modalManager.loadHistory();
        });
    }

    // Setup clear history button
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            window.modalManager.clearAllHistory();
        });
    }
});

// Fungsi cetak struk (tetap sama seperti sebelumnya)
function printReceipt(transaction) {
    // ... implementation sama dengan sebelumnya
    console.log('Printing receipt for transaction:', transaction);
}