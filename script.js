document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const logoutBtn = document.getElementById('logout-btn');
    const cashierSection = document.getElementById('cashier-section');
    const managementSection = document.getElementById('management-section');
    const showCashierBtn = document.getElementById('show-cashier-btn');
    const showManagementBtn = document.getElementById('show-management-btn');

    // Menangani form login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Kirim data ke backend (API)
        // const response = await fetch('/login', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username, password })
        // });
        
        // Contoh sederhana tanpa backend
        if (username === 'admin' && password === 'admin123') {
            loginPage.classList.add('hidden');
            dashboardPage.classList.remove('hidden');
            loginMessage.textContent = '';
        } else {
            loginMessage.textContent = 'Username atau password salah.';
        }
    });

    // Menangani logout
    logoutBtn.addEventListener('click', () => {
        loginPage.classList.remove('hidden');
        dashboardPage.classList.add('hidden');
        loginForm.reset();
    });

    // Menampilkan bagian kasir
    showCashierBtn.addEventListener('click', () => {
        cashierSection.classList.remove('hidden');
        managementSection.classList.add('hidden');
    });

    // Menampilkan bagian manajemen
    showManagementBtn.addEventListener('click', () => {
        cashierSection.classList.add('hidden');
        managementSection.classList.remove('hidden');
        // Di sini Anda akan memanggil fungsi untuk memuat data barang
        // loadItems();
    });

    // Logika untuk fitur lainnya (kasir, manajemen) akan ditambahkan di sini
});
