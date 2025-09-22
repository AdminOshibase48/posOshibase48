// Variabel untuk kamera dan kontrol
let stream = null;
let isScanning = false;
let scanTimeout = null;

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

// Fungsi untuk memulai kamera dengan deteksi barcode yang lebih baik
async function startCamera() {
    try {
        // Meminta izin untuk mengakses kamera
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: false 
        });
        
        const video = document.getElementById('camera-preview');
        video.srcObject = stream;
        
        // Tampilkan tombol stop, sembunyikan tombol start
        document.getElementById('start-camera').style.display = 'none';
        document.getElementById('stop-camera').style.display = 'block';
        
        // Mulai deteksi barcode dengan konfigurasi yang lebih baik
        startBarcodeDetection(video);
    } catch (error) {
        console.error('Error mengakses kamera:', error);
        alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin.');
    }
}

// Fungsi deteksi barcode yang lebih akurat
function startBarcodeDetection(video) {
    isScanning = true;
    document.getElementById('barcode-result').textContent = 'Arahkan kamera ke barcode...';
    document.getElementById('barcode-result').className = 'scanning';
    
    // Clear previous timeout
    if (scanTimeout) {
        clearTimeout(scanTimeout);
    }
    
    // Konfigurasi Quagga.js untuk deteksi yang lebih akurat
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: video,
            constraints: {
                width: 640,
                height: 480,
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "upc_reader",
                "upc_e_reader"
            ]
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        }
    }, function(err) {
        if (err) {
            console.error("Error initializing Quagga:", err);
            // Fallback ke simulasi jika Quagga gagal
            simulateBarcodeDetection();
            return;
        }
        
        Quagga.start();
        
        // Deteksi ketika barcode ditemukan
        Quagga.onDetected(function(result) {
            if (!isScanning) return;
            
            const code = result.codeResult.code;
            if (isValidBarcode(code)) {
                handleBarcodeDetected(code);
            }
        });
    });
    
    // Timeout untuk otomatis stop setelah 30 detik
    scanTimeout = setTimeout(() => {
        if (isScanning) {
            document.getElementById('barcode-result').textContent = 'Scan dibatalkan (timeout)';
            document.getElementById('barcode-result').className = 'timeout';
            stopCamera();
        }
    }, 30000);
}

// Validasi format barcode
function isValidBarcode(code) {
    if (!code) return false;
    
    // Validasi panjang barcode umum
    const length = code.length;
    return length === 8 || length === 12 || length === 13 || length === 14;
}

// Handle ketika barcode terdeteksi
function handleBarcodeDetected(barcode) {
    if (!isScanning) return;
    
    isScanning = false;
    
    document.getElementById('barcode-result').textContent = `Barcode terdeteksi: ${barcode}`;
    document.getElementById('barcode-result').className = 'success';
    
    // Isi nilai ke input kode produk
    document.getElementById('product-code').value = barcode;
    
    // Stop Quagga
    Quagga.stop();
    
    // Hentikan kamera setelah 2 detik
    setTimeout(() => {
        stopCamera();
        document.getElementById('camera-modal').style.display = 'none';
    }, 2000);
}

// Simulasi deteksi barcode (fallback)
function simulateBarcodeDetection() {
    document.getElementById('barcode-result').textContent = 'Mencari barcode... (Mode Simulasi)';
    document.getElementById('barcode-result').className = 'scanning';
    
    // Reset status scanning
    isScanning = true;
    
    // Clear previous timeout
    if (scanTimeout) {
        clearTimeout(scanTimeout);
    }
    
    // Timeout untuk simulasi
    scanTimeout = setTimeout(() => {
        if (isScanning) {
            document.getElementById('barcode-result').textContent = 'Tidak ada barcode terdeteksi';
            document.getElementById('barcode-result').className = 'no-barcode';
        }
    }, 10000);
}

// Fungsi untuk menghentikan kamera
function stopCamera() {
    isScanning = false;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Stop Quagga jika sedang berjalan
    try {
        Quagga.stop();
    } catch (e) {
        // Ignore errors if Quagga wasn't running
    }
    
    // Clear timeout
    if (scanTimeout) {
        clearTimeout(scanTimeout);
        scanTimeout = null;
    }
    
    // Tampilkan tombol start, sembunyikan tombol stop
    document.getElementById('start-camera').style.display = 'block';
    document.getElementById('stop-camera').style.display = 'none';
    
    // Reset status barcode
    document.getElementById('barcode-result').textContent = '';
    document.getElementById('barcode-result').className = '';
}

// Manual barcode input sebagai fallback
document.getElementById('manual-barcode').addEventListener('click', function() {
    stopCamera();
    document.getElementById('camera-modal').style.display = 'none';
    
    const manualCode = prompt('Masukkan kode barcode manual:');
    if (manualCode && manualCode.trim() !== '') {
        document.getElementById('product-code').value = manualCode.trim();
    }
});

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
    
    // Validasi
    if (!code) {
        alert('Silakan scan barcode atau masukkan kode produk manual!');
        return;
    }
    
    alert(`Produk ${name} dengan kode ${code} berhasil ditambahkan!`);
    
    // Reset form
    this.reset();
    document.getElementById('image-preview').innerHTML = `
        <i class="fas fa-image"></i>
        <span>Pratinjau gambar akan muncul di sini</span>
    `;
});
