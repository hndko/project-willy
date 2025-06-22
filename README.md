# Project Willy - Sistem Informasi Manajemen Notice Scent

Project Willy adalah aplikasi web komprehensif yang dirancang sebagai Sistem Informasi Manajemen Stok dan Keuangan untuk bisnis parfum "Notice Scent". Aplikasi ini mengelola seluruh siklus operasional bisnis, mulai dari pengadaan bahan baku, proses produksi, manajemen stok, penjualan, hingga pembuatan invoice dan laporan.

## 🚀 Fitur Utama

Aplikasi ini dibagi menjadi beberapa modul utama untuk mengelola berbagai aspek bisnis:

* **Dashboard**: Tampilan ringkasan metrik-metrik penting bisnis.
* **Manajemen Pengguna & Peran**: Mengelola pengguna dan hak aksesnya (Admin, Sales, Stock).
* **Manajemen Data Master**:
    * **Produk**: Mengelola data produk jadi, termasuk harga jual dan harga pokok.
    * **Kategori**: Mengelompokkan produk berdasarkan kategori.
    * **Bahan Baku**: Mengelola data bahan mentah yang digunakan untuk produksi.
    * **Supplier**: Mengelola data pemasok bahan baku.
    * **Customer**: Mengelola data pelanggan.
* **Manajemen Transaksi**:
    * **Pembelian**: Mencatat transaksi pembelian bahan baku dari supplier.
    * **Penjualan**: Mencatat transaksi penjualan produk ke pelanggan.
    * **Biaya Operasional**: Mencatat pengeluaran di luar pembelian bahan baku.
* **Manajemen Stok**:
    * Melacak stok masuk dan keluar untuk produk jadi dan bahan baku secara otomatis.
    * Mendukung penyesuaian stok manual (Stock Opname).
    * Mencatat pemakaian bahan baku di luar produksi (misal: untuk sampel).
* **Manajemen Produksi**:
    * **Bill of Materials (BoM)**: Mendefinisikan resep atau komposisi bahan baku untuk setiap produk.
    * **Produksi**: Mencatat proses produksi yang mengkonversi bahan baku menjadi produk jadi, dengan penyesuaian stok otomatis.
* **Manajemen Keuangan & Pengiriman**:
    * **Invoice**: Membuat invoice secara otomatis dari setiap transaksi penjualan dan mengelola status pembayarannya.
    * **Pengiriman (Delivery)**: Membuat data pengiriman dari setiap penjualan dan melacak statusnya.
* **Laporan**:
    * Menyediakan laporan stok terperinci.
* **Log Aktivitas**: Merekam semua aktivitas penting yang terjadi di dalam sistem.
* **Manajemen Profil Perusahaan**: Mengatur informasi dasar perusahaan.

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan arsitektur **MOVN (MySQL, Express.js, Vue.js, Node.js)**.

**Backend:**
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MySQL
* **ORM**: Sequelize (dengan `sequelize-cli` untuk migrasi & seeder)
* **Autentikasi**: JSON Web Tokens (JWT) dengan Access & Refresh Token
* **File Upload**: Multer

**Frontend:**
* **Framework**: Vue 3 (dengan Composition API)
* **Build Tool**: Vite
* **State Management**: Pinia
* **Styling**: TailwindCSS
* **UI Component Library**: PrimeVue
* **HTTP Client**: Axios

---

## ⚙️ Panduan Instalasi & Setup Lokal

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lingkungan pengembangan Anda.

### Prasyarat

* **Node.js**: Versi 16 atau lebih tinggi.
* **NPM**: Biasanya terinstal bersama Node.js.
* **MySQL**: Pastikan server database MySQL Anda sudah berjalan.

### Langkah 1: Pengaturan Backend

1.  **Buat Database**: Buat sebuah database baru di MySQL. Contoh: `project_willy_db`.

2.  **Konfigurasi Environment**:
    * Masuk ke direktori `backend/`.
    * Buat file baru bernama `.env`.
    * Salin konten di bawah ini ke dalam file `.env` dan sesuaikan dengan konfigurasi database serta kunci rahasia Anda.

    ```env
    # Konfigurasi Database
    DB_HOST=localhost
    DB_USERNAME=root
    DB_PASSWORD=password_database_anda
    DB_DATABASE=project_willy_db
    DB_CONNECTION=mysql

    # Port Server
    PORT=8080

    # Kunci Rahasia JWT (Generate string acak yang kuat untuk ini)
    JWT_SECRET=kunci-rahasia-anda-yang-sangat-aman
    JWT_EXPIRES_IN=1h
    JWT_REFRESH_SECRET=kunci-rahasia-lain-yang-juga-aman
    JWT_REFRESH_EXPIRES_IN=7d
    ```

3.  **Instalasi Dependensi**:
    * Buka terminal di dalam direktori `backend/`.
    * Jalankan perintah:
        ```bash
        npm install
        ```

4.  **Menjalankan Migrasi & Seeder**:
    * Perintah ini akan membuat semua struktur tabel dan mengisi data awal (seperti role dan user admin).
    * Pastikan Anda masih di dalam direktori `backend/`.
    * Jalankan perintah berikut secara berurutan:
        ```bash
        npx sequelize-cli db:migrate
        npx sequelize-cli db:seed:all
        ```

5.  **Menjalankan Server Backend**:
    * Jalankan perintah:
        ```bash
        npm run dev
        ```
    * Server backend akan berjalan di `http://localhost:8080`.

### Langkah 2: Pengaturan Frontend

1.  **Instalasi Dependensi**:
    * Buka terminal baru dan masuk ke direktori `frontend/`.
    * Jalankan perintah:
        ```bash
        npm install
        ```

2.  **Menjalankan Server Frontend**:
    * Masih di direktori `frontend/`, jalankan:
        ```bash
        npm run dev
        ```
    * Server frontend akan berjalan di `http://localhost:8000`.

### Langkah 3: Mengakses Aplikasi

1.  Buka browser Anda dan kunjungi alamat `http://localhost:8000`.
2.  Anda akan diarahkan ke halaman login. Gunakan kredensial admin default yang telah dibuat oleh seeder:
    * **Email**: `notice@mail.com`
    * **Password**: `12345678`

Selamat! Sekarang Anda dapat mulai menjelajahi dan menggunakan aplikasi.
