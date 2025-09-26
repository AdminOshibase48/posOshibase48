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
const cashAmountInput = document.getElementById('cash-amount');
const changeAmountElement = document.getElementById('change-amount');
const checkoutTotalElement = document.getElementById('checkout-total');
const confirmPaymentBtn = document.getElementById('confirm-payment');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const historyDateFilter = document.getElementById('history-date');
const applyFilterBtn = document.getElementById('apply-filter');
const clearHistoryBtn = document.getElementById('clear-history');
const cashButtons = document.querySelectorAll('.cash-btn');
const cashError = document.getElementById('cash-error');

// Modal elements
const editItemModal = document.getElementById('edit-item-modal');
const editProductName = document.getElementById('edit-product-name');
const editProductPrice = document.getElementById('edit-product-price');
const editProductQuantity = document.getElementById('edit-product-quantity');
const editProductMaxStock = document.getElementById('edit-product-max-stock');
const editProductId = document.getElementById('edit-product-id');
const cancelEditBtn = document.getElementById('cancel-edit');
const saveEditBtn = document.getElementById('save-edit');

// Utility Functions
const Utils = {
    formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    generateTransactionId() {
        return `T${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    },

    validatePositiveNumber(value) {
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
    },

    validateCashAmount(amount) {
        const num = parseInt(amount);
        return !isNaN(num) && num >= 0;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Improved Modal Manager Class
class ModalManager {
    constructor() {
        this.currentEditItemId = null;
        this.initModals();
    }

    initModals() {
        // Setup modal event listeners
        this.setupModalEvents();
        this.setupEditItemForm();
        this.initTabs();
        
        // Close modal when clicking outside or pressing Escape
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupModalEvents() {
        // History Modal
        const historyBtn = document.getElementById('history-btn');
        const historyClose = document.querySelector('#history-modal .close');

        historyBtn?.addEventListener('click', () => {
            this.openModal('history-modal');
            this.loadHistory();
        });

        historyClose?.addEventListener('click', () => {
            this.closeModal('history-modal');
        });

        // Products Modal
        const productsBtn = document.getElementById('manage-products-btn');
        const productsClose = document.querySelector('#products-modal .close');

        productsBtn?.addEventListener('click', () => {
            this.openModal('products-modal');
            this.loadAdminProducts();
        });

        productsClose?.addEventListener('click', () => {
            this.closeModal('products-modal');
        });

        // Checkout Modal
        const checkoutClose = document.querySelector('#checkout-modal .close');

        checkoutBtn?.addEventListener('click', () => {
            if (cart.length === 0) {
                this.showToast('Keranjang belanja kosong!', 'error');
                return;
            }
            this.openCheckoutModal();
        });

        checkoutClose?.addEventListener('click', () => {
            this.closeModal('checkout-modal');
        });

        // Edit Item Modal
        const editClose = document.querySelector('#edit-item-modal .close');
        editClose?.addEventListener('click', () => {
            this.closeModal('edit-item-modal');
        });

        cancelEditBtn?.addEventListener('click', () => {
            this.closeModal('edit-item-modal');
        });
    }

    setupEditItemForm() {
        saveEditBtn?.addEventListener('click', () => {
            this.saveEditedItem();
        });

        editProductQuantity?.addEventListener('input', () => {
            this.validateEditQuantity();
        });

        editProductQuantity?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveEditedItem();
            }
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

        this.currentEditItemId = productId;
        
        editProductId.value = productId;
        editProductName.value = cartItem.name;
        editProductPrice.value = cartItem.price;
        editProductQuantity.value = cartItem.quantity;
        editProductMaxStock.value = product.stock + cartItem.quantity;

        editProductQuantity.max = product.stock + cartItem.quantity;
        editProductQuantity.min = 1;

        this.openModal('edit-item-modal');
        editProductQuantity.focus();
    }

    saveEditedItem() {
        if (!this.currentEditItemId) return;

        const newQuantity = parseInt(editProductQuantity.value);
        
        if (!Utils.validatePositiveNumber(newQuantity)) {
            this.showToast('Quantity tidak valid!', 'error');
            return;
        }

        const cartItem = cart.find(item => item.id === this.currentEditItemId);
        const product = products.find(p => p.id === this.currentEditItemId);

        if (!cartItem || !product) {
            this.showToast('Produk tidak ditemukan!', 'error');
            return;
        }

        const maxAvailable = product.stock + cartItem.quantity;
        if (newQuantity > maxAvailable) {
            this.showToast(`Stok tidak mencukupi! Maksimal: ${maxAvailable}`, 'error');
            return;
        }

        cartItem.quantity = newQuantity;

        if (newQuantity === 0) {
            cart = cart.filter(item => item.id !== this.currentEditItemId);
            this.showToast('Produk dihapus dari keranjang');
        } else {
            this.showToast(`Quantity ${cartItem.name} diubah menjadi ${newQuantity}`);
        }

        saveToStorage();
        updateCart();
        this.closeModal('edit-item-modal');
        this.currentEditItemId = null;
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
        this.currentEditItemId = null;
    }

    openCheckoutModal() {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        checkoutTotalElement.textContent = Utils.formatRupiah(total);
        cashAmountInput.value = '';
        changeAmountElement.textContent = Utils.formatRupiah(0);
        cashError.style.display = 'none';

        this.openModal('checkout-modal');
        cashAmountInput.focus();
    }

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');

                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                btn.classList.add('active');
                document.getElementById(tabName)?.classList.add('active');
            });
        });
    }

    async loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        historyList.innerHTML = '<div class="empty-history"><i class="fas fa-spinner fa-spin"></i><h3>Memuat riwayat...</h3></div>';

        try {
            let transactionsData = Array.isArray(transactions) ? transactions : Object.values(transactions || {});

            if (!transactionsData.length) {
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

            if (historyDateFilter?.value) {
                const filterDate = new Date(historyDateFilter.value).toLocaleDateString('id-ID');
                filteredTransactions = transactionsData.filter(transaction => {
                    const transactionDate = new Date(transaction.timestamp).toLocaleDateString('id-ID');
                    return transactionDate === filterDate;
                });
            }

            if (!filteredTransactions.length) {
                historyList.innerHTML = `
                    <div class="empty-history">
                        <i class="fas fa-search"></i>
                        <h3>Tidak ada transaksi pada tanggal ini</h3>
                        <p>Coba pilih tanggal lain atau lihat semua transaksi</p>
                    </div>
                `;
                return;
            }

            filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            historyList.innerHTML = filteredTransactions.map((transaction, index) => 
                this.createHistoryItem(transaction, index)
            ).join('');

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
                    <div class="history-product-details">${item.quantity || 0} x ${Utils.formatRupiah(item.price || 0)}</div>
                </div>
                <div>${Utils.formatRupiah((item.quantity || 0) * (item.price || 0))}</div>
            </div>
        `).join('') : '';

        return `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-id">Transaksi #${transactionId.toString().substring(0, 8)}</div>
                    <div class="history-date">${date}</div>
                </div>
                <div class="history-details">
                    <div class="history-products">${productsHTML}</div>
                    <div class="history-summary">
                        <div class="history-subtotal">
                            <span>Subtotal:</span>
                            <span>${Utils.formatRupiah(transaction.subtotal || 0)}</span>
                        </div>
                        <div class="history-tax">
                            <span>Pajak (10%):</span>
                            <span>${Utils.formatRupiah(transaction.tax || 0)}</span>
                        </div>
                        <div class="history-total">
                            <span>Total:</span>
                            <span>${Utils.formatRupiah(transaction.total || 0)}</span>
                        </div>
                        <div class="history-cash">
                            <span>Bayar:</span>
                            <span>${Utils.formatRupiah(transaction.cash || 0)}</span>
                        </div>
                        <div class="history-change">
                            <span>Kembali:</span>
                            <span>${Utils.formatRupiah(transaction.change || 0)}</span>
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
            transactions = transactions.filter(transaction => {
                const id = transaction.id || transaction.key;
                return id != transactionId;
            });

            localStorage.setItem('transactions', JSON.stringify(transactions));
            await database.ref('transactions').set(transactions);

            this.loadHistory();
            this.showToast('Transaksi berhasil dihapus');

        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showToast('Gagal menghapus transaksi', 'error');
        }
    }

    async clearAllHistory() {
        if (!transactions.length) {
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
        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;

        const colors = {
            error: '#e53e3e',
            info: '#3182ce',
            success: '#38a169'
        };

        toast.style.background = colors[type] || colors.success;
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

// Improved initialization function
async function initializeData() {
    try {
        // Try Firebase first
        const [productsSnapshot, transactionsSnapshot] = await Promise.all([
            database.ref('products').once('value'),
            database.ref('transactions').once('value')
        ]);

        const firebaseProducts = productsSnapshot.val();
        const firebaseTransactions = transactionsSnapshot.val();

        // Handle products data
        if (firebaseProducts) {
            products = Array.isArray(firebaseProducts) ? firebaseProducts : Object.values(firebaseProducts);
            localStorage.setItem('products', JSON.stringify(products));
        } else {
            products = getDefaultProducts();
            await database.ref('products').set(products);
        }

        // Handle transactions data
        if (firebaseTransactions) {
            transactions = Array.isArray(firebaseTransactions) ? firebaseTransactions : Object.values(firebaseTransactions);
            localStorage.setItem('transactions', JSON.stringify(transactions));
        } else {
            transactions = [];
            await database.ref('transactions').set(transactions);
        }

        // Load cart from localStorage
        cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Load UI
        loadProducts();
        updateCart();
        setupRealtimeListeners();

    } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to localStorage
        fallbackToLocalStorage();
    }
}

function getDefaultProducts() {
    return [
        { id: 1, name: 'Buku Tulis', code: 'BT001', price: 3500, stock: 50 },
        { id: 2, name: 'Pensil 2B', code: 'PN002', price: 2000, stock: 100 },
        { id: 3, name: 'Penghapus', code: 'PH003', price: 1500, stock: 80 },
        { id: 4, name: 'Penggaris', code: 'PG004', price: 3000, stock: 40 },
        { id: 5, name: 'Spidol', code: 'SP005', price: 7000, stock: 30 },
        { id: 6, name: 'Stapler', code: 'ST006', price: 15000, stock: 20 }
    ];
}

function fallbackToLocalStorage() {
    products = JSON.parse(localStorage.getItem('products')) || getDefaultProducts();
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    loadProducts();
    updateCart();
}

function setupRealtimeListeners() {
    database.ref('products').on('value', (snapshot) => {
        const firebaseProducts = snapshot.val();
        if (firebaseProducts) {
            products = Array.isArray(firebaseProducts) ? firebaseProducts : Object.values(firebaseProducts);
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
        }
    });

    database.ref('transactions').on('value', (snapshot) => {
        const firebaseTransactions = snapshot.val();
        if (firebaseTransactions) {
            transactions = Array.isArray(firebaseTransactions) ? firebaseTransactions : Object.values(firebaseTransactions);
            localStorage.setItem('transactions', JSON.stringify(transactions));
        }
    });
}

// Improved product loading with better error handling
function loadProducts() {
    if (!productsGrid) return;

    const searchTerm = searchProductInput?.value.toLowerCase() || '';
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.code.toLowerCase().includes(searchTerm)
    );

    productsGrid.innerHTML = filteredProducts.filter(product => product.stock > 0)
        .map(product => `
            <div class="product-card">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="code">${product.code}</div>
                    <div class="price">${Utils.formatRupiah(product.price)}</div>
                    <div class="stock">Stok: ${product.stock}</div>
                </div>
                <button class="add-to-cart" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Tambah
                </button>
            </div>
        `).join('');

    // Add event listeners
    productsGrid.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            addToCart(productId);
        });
    });
}

// Improved cart functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        window.modalManager.showToast('Produk tidak ditemukan!', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
            window.modalManager.showToast(`${product.name} ditambahkan ke keranjang`);
        } else {
            window.modalManager.showToast('Stok tidak cukup!', 'error');
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
            window.modalManager.showToast('Stok habis!', 'error');
            return;
        }
    }

    saveToStorage();
    updateCart();
}

function updateCart() {
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Keranjang belanja kosong</div>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${Utils.formatRupiah(item.price)}</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item-total">${Utils.formatRupiah(item.price * item.quantity)}</div>
                <div class="cart-item-actions">
                    <button class="edit-item" data-id="${item.id}" title="Edit jumlah">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-item" data-id="${item.id}" title="Hapus dari keranjang">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    if (subtotalElement) subtotalElement.textContent = Utils.formatRupiah(subtotal);
    if (taxElement) taxElement.textContent = Utils.formatRupiah(tax);
    if (totalElement) totalElement.textContent = Utils.formatRupiah(total);

    // Add event listeners
    attachCartEventListeners();
}

function attachCartEventListeners() {
    cartItems.querySelectorAll('.increase').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            increaseQuantity(productId);
        });
    });

    cartItems.querySelectorAll('.decrease').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            decreaseQuantity(productId);
        });
    });

    cartItems.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            removeFromCart(productId);
        });
    });

    cartItems.querySelectorAll('.edit-item').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            window.modalManager.openEditItemModal(productId);
        });
    });
}

// Improved storage function with better error handling
async function saveToStorage() {
    try {
        // Save to localStorage
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('transactions', JSON.stringify(transactions));

        // Save to Firebase
        await Promise.all([
            database.ref('products').set(products),
            database.ref('transactions').set(transactions)
        ]);
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        window.modalManager.showToast('Gagal menyimpan data ke server', 'error');
    }
}

// Cart quantity functions
function increaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);

    if (!item || !product) {
        window.modalManager.showToast('Produk tidak ditemukan!', 'error');
        return;
    }

    if (item.quantity < product.stock) {
        item.quantity++;
        saveToStorage();
        updateCart();
        window.modalManager.showToast(`${item.name} ditambahkan`);
    } else {
        window.modalManager.showToast('Stok tidak cukup!', 'error');
    }
}

function decreaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);

    if (!item) {
        window.modalManager.showToast('Produk tidak ditemukan!', 'error');
        return;
    }

    if (item.quantity > 1) {
        item.quantity--;
        saveToStorage();
        updateCart();
        window.modalManager.showToast(`${item.name} dikurangi`);
    } else {
        removeFromCart(productId);
    }
}

function removeFromCart(productId) {
    const item = cart.find(item => item.id === productId);
    
    if (!item) {
        window.modalManager.showToast('Produk tidak ditemukan!', 'error');
        return;
    }

    cart = cart.filter(item => item.id !== productId);
    saveToStorage();
    updateCart();
    window.modalManager.showToast(`${item.name} dihapus dari keranjang`);
}

// Payment functions
function setupPaymentEvents() {
    // Cash buttons
    cashButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = parseInt(this.getAttribute('data-amount'));
            cashAmountInput.value = amount;
            calculateChange();
            cashError.style.display = 'none';
        });
    });

    // Cash amount input
    cashAmountInput?.addEventListener('input', calculateChange);

    // Confirm payment
    confirmPaymentBtn?.addEventListener('click', processPayment);

    // Clear cart
    clearCartBtn?.addEventListener('click', () => {
        if (cart.length > 0 && confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
            cart = [];
            saveToStorage();
            updateCart();
            window.modalManager.showToast('Keranjang dikosongkan');
        }
    });
}

function calculateChange() {
    if (!cashAmountInput || !changeAmountElement) return;

    const cashAmount = parseInt(cashAmountInput.value) || 0;
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const change = cashAmount - total;

    changeAmountElement.textContent = Utils.formatRupiah(Math.max(0, change));
    cashError.style.display = change >= 0 ? 'none' : 'flex';
}

async function processPayment() {
    const cashAmount = parseInt(cashAmountInput.value) || 0;
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    if (!Utils.validateCashAmount(cashAmount)) {
        window.modalManager.showToast('Jumlah uang tidak valid!', 'error');
        return;
    }

    if (cashAmount < total) {
        cashError.style.display = 'flex';
        cashAmountInput.focus();
        window.modalManager.showToast('Jumlah uang tidak cukup!', 'error');
        return;
    }

    // Validate stock
    for (const cartItem of cart) {
        const product = products.find(p => p.id === cartItem.id);
        if (!product || product.stock < cartItem.quantity) {
            window.modalManager.showToast(`Stok ${cartItem.name} tidak mencukupi!`, 'error');
            return;
        }
    }

    // Process transaction
    try {
        // Update stock
        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                product.stock = Math.max(0, product.stock - cartItem.quantity);
            }
        });

        // Create transaction
        const transaction = {
            id: Utils.generateTransactionId(),
            timestamp: new Date().toISOString(),
            items: [...cart],
            subtotal: subtotal,
            tax: tax,
            total: total,
            cash: cashAmount,
            change: cashAmount - total
        };

        transactions.push(transaction);

        await saveToStorage();
        printReceipt(transaction);

        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCart();

        window.modalManager.closeModal('checkout-modal');
        loadProducts();
        window.modalManager.showToast('Transaksi berhasil!');

    } catch (error) {
        console.error('Error processing payment:', error);
        window.modalManager.showToast('Error menyimpan transaksi.', 'error');
    }
}

// Improved receipt printing
function printReceipt(transaction) {
    try {
        const receiptWindow = window.open('', '_blank', 'width=300,height=600');
        
        if (!receiptWindow) {
            // Fallback to console if popup is blocked
            console.log('Receipt Transaction:', transaction);
            window.modalManager.showToast('Popup diblokir, struk dicetak di konsol', 'info');
            return;
        }

        receiptWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Transaksi</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 10px; }
                    .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .summary { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
                    .summary-row { display: flex; justify-content: space-between; margin: 3px 0; }
                    .total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>TOKO SERBA ADA</h2>
                    <p>Struk Transaksi</p>
                    <p>${new Date(transaction.timestamp).toLocaleString('id-ID')}</p>
                    <p>ID: ${transaction.id}</p>
                </div>
                
                <div class="items">
                    ${transaction.items.map(item => `
                        <div class="item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>${Utils.formatRupiah(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>${Utils.formatRupiah(transaction.subtotal)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Pajak (10%):</span>
                        <span>${Utils.formatRupiah(transaction.tax)}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>${Utils.formatRupiah(transaction.total)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Bayar:</span>
                        <span>${Utils.formatRupiah(transaction.cash)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Kembali:</span>
                        <span>${Utils.formatRupiah(transaction.change)}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <p>Terima kasih atas kunjungan Anda</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error printing receipt:', error);
        window.modalManager.showToast('Error mencetak struk', 'error');
    }
}

// Search functionality with debounce
if (searchProductInput) {
    const debouncedLoadProducts = Utils.debounce(loadProducts, 300);
    searchProductInput.addEventListener('input', debouncedLoadProducts);
}

// History filter events
if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', () => {
        window.modalManager.loadHistory();
    });
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        window.modalManager.clearAllHistory();
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modal manager first
    window.modalManager = new ModalManager();
    
    // Then initialize data and setup events
    initializeData();
    setupPaymentEvents();
    
    console.log('POS System initialized successfully');
});
