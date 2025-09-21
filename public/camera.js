// Variabel untuk kamera
let stream = null;

// Event listener untuk tombol scan barcode
document.getElementById('scan-barcode').addEventListener('click', function() {
    document.getElementById('camera-modal').style.display = 'block';
});

// Event listener untuk tombol mulai kamera
document.getElementById('start-camera').addEventListener('click', startCamera);

// Event listener untuk tombol stop kamera
document.getElementById('stop-camera').addEventListener('click', stopCamera);

// Tutup modal kamera
document.querySelector('#camera-modal .close').addEventListener('click', function() {
    stopCamera();
    document.getElementById('camera-modal').style.display = 'none';
});

// Event listener untuk unggah gambar
document.getElementById('upload-image').addEventListener('click', function() {
    document.getElementById('product-image').click();
});

// Event listener untuk ambil foto
document.getElementById('capture-camera').addEventListener('click', async function() {
    try {
        // Meminta izin untuk mengakses kamera
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
        });
        
        // Membuat video element untuk menampilkan pratinjau kamera
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        // Membuat canvas untuk menangkap gambar
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Tunggu sampai video siap
        video.addEventListener('loadedmetadata', function() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Ambil frame dari video
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Konversi canvas ke data URL
            const imageDataURL = canvas.toDataURL('image/jpeg');
            
            // Tampilkan pratinjau gambar
            displayImagePreview(imageDataURL);
            
            // Hentikan kamera
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        });
    } catch (error) {
        console.error('Error mengakses kamera:', error);
        alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin.');
    }
});

// Event listener untuk perubahan file input
document.getElementById('product-image').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            displayImagePreview(event.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Fungsi untuk menampilkan pratinjau gambar
function displayImagePreview(imageDataURL) {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = imageDataURL;
    preview.appendChild(img);
}

// Fungsi untuk memulai kamera
async function startCamera() {
    try {
        // Meminta izin untuk mengakses kamera
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
        });
        
        const video = document.getElementById('camera-preview');
        video.srcObject = stream;
        
        // Tampilkan tombol stop, sembunyikan tombol start
        document.getElementById('start-camera').style.display = 'none';
        document.getElementById('stop-camera').style.display = 'block';
        
        // Mulai deteksi barcode sederhana (simulasi)
        simulateBarcodeDetection();
    } catch (error) {
        console.error('Error mengakses kamera:', error);
        alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin.');
    }
}

// Fungsi untuk menghentikan kamera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Tampilkan tombol start, sembunyikan tombol stop
    document.getElementById('start-camera').style.display = 'block';
    document.getElementById('stop-camera').style.display = 'none';
    
    // Bersihkan hasil barcode
    document.getElementById('barcode-result').textContent = '';
}

// Simulasi deteksi barcode (untuk demo)
function simulateBarcodeDetection() {
    document.getElementById('barcode-result').textContent = 'Mencari barcode...';
    
    // Simulasi proses scanning
    setTimeout(() => {
        // Generate kode acak untuk demo
        const randomBarcode = '8' + Math.floor(100000000000 + Math.random() * 900000000000).toString().substring(1);
        document.getElementById('barcode-result').textContent = `Barcode terdeteksi: ${randomBarcode}`;
        
        // Isi nilai ke input kode produk
        document.getElementById('product-code').value = randomBarcode;
        
        // Hentikan kamera setelah 3 detik
        setTimeout(() => {
            stopCamera();
            document.getElementById('camera-modal').style.display = 'none';
        }, 3000);
    }, 2000);
}

// Modifikasi form submit untuk menyimpan gambar
document.getElementById('add-product-form').addEventListener('submit', function(e) {
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
    
    // Di sini Anda akan menambahkan logika untuk menyimpan produk
    // dengan data gambar (imageData) ke database
    
    alert(`Produk ${name} dengan kode ${code} berhasil ditambahkan!`);
    
    // Reset form
    this.reset();
    document.getElementById('image-preview').innerHTML = `
        <i class="fas fa-image"></i>
        <span>Pratinjau gambar akan muncul di sini</span>
    `;
});
