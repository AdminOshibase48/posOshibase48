// ==============================
// Inisialisasi Firebase
// Pastikan sudah include SDK Firebase di HTML:
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
// ==============================

const firebaseConfig = {
  apiKey: "AIzaSyDdCF4P0eUaJp_l5EzGR_JAP2IPdzjJytY",
  authDomain: "pososhibase48.firebaseapp.com",
  databaseURL: "https://pososhibase48-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pososhibase48",
  storageBucket: "pososhibase48.firebasestorage.app",
  messagingSenderId: "949946735395",
  appId: "1:949946735395:web:a1c8b6fa6630780d964a96"
};

// Cegah error "already initialized"
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

// ==============================
// Data Produk, Cart, dan Transaksi
// ==============================
let products = [];
let cart = [];
let transactions = [];

// ==============================
// Inisialisasi Data
// ==============================
async function initializeData() {
  try {
    const snapshot = await database.ref('products').once('value');
    const firebaseProducts = snapshot.val();

    if (firebaseProducts && Object.keys(firebaseProducts).length > 0) {
      // Ubah object Firebase jadi array
      products = Object.values(firebaseProducts);
      localStorage.setItem('products', JSON.stringify(products));
      showToast('Data produk disinkronisasi dari cloud');
    } else {
      // Data default
      products = JSON.parse(localStorage.getItem('products')) || [
        { id: 1, name: 'Buku Tulis', code: 'BT001', price: 5000, stock: 50 },
        { id: 2, name: 'Pensil 2B', code: 'PN002', price: 2000, stock: 100 },
        { id: 3, name: 'Penghapus', code: 'PH003', price: 1500, stock: 80 },
        { id: 4, name: 'Penggaris', code: 'PG004', price: 3000, stock: 40 },
        { id: 5, name: 'Spidol', code: 'SP005', price: 7000, stock: 30 },
        { id: 6, name: 'Stapler', code: 'ST006', price: 15000, stock: 20 }
      ];
      await database.ref('products').set(products);
    }

    // Load cart & transaksi dari localStorage
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    loadProducts();
    updateCart();

    setupRealtimeListeners();
  } catch (error) {
    console.error('Error initializing data:', error);
    products = JSON.parse(localStorage.getItem('products')) || [];
    loadProducts();
    updateCart();
  }
}

// ==============================
// Listener Realtime
// ==============================
function setupRealtimeListeners() {
  database.ref('products').on('value', (snapshot) => {
    const firebaseProducts = snapshot.val();
    if (firebaseProducts) {
      products = Object.values(firebaseProducts);
      localStorage.setItem('products', JSON.stringify(products));
      loadProducts();
      showToast('Data produk diperbarui dari cloud');
    }
  });

  database.ref('transactions').on('value', (snapshot) => {
    const firebaseTransactions = snapshot.val();
    if (firebaseTransactions) {
      transactions = Object.values(firebaseTransactions);
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  });
}

// ==============================
// Simpan ke Firebase + localStorage
// ==============================
async function saveToStorage() {
  try {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Simpan ke Firebase (pakai ID biar konsisten)
    const productsObj = {};
    products.forEach(p => { productsObj[p.id] = p; });
    await database.ref('products').set(productsObj);

    const transactionsObj = {};
    transactions.forEach(t => { transactionsObj[t.id] = t; });
    await database.ref('transactions').set(transactionsObj);
  } catch (error) {
    console.error('Error saving to Firebase:', error);
  }
}
