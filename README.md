# RZStore — Online Shop

Aplikasi online shop fullstack client-side yang dibangun dengan **Vanilla JavaScript (ES6+)**, **Tailwind CSS**, dan **LocalStorage** sebagai database simulasi.

## 🚀 Demo

👉 [**Live Demo RZStore di GitHub Pages**](https://muhamad-rhifa.github.io/Muhamad_Rhifa_A_UTS_Web2/)

## ✨ Fitur

### Fitur Wajib
- ✅ **Authentication** — Login & Register dengan validasi (email unik, password min 6 karakter)
- ✅ **Product Management** — Tampil produk dari JSON, detail produk lengkap
- ✅ **Search & Filter** — Cari nama/tag, filter kategori, filter harga, sort
- ✅ **Cart** — Tambah/hapus/update item, total otomatis
- ✅ **Checkout** — Form pengiriman, generate ID transaksi (TRX...)
- ✅ **Order History** — Riwayat pembelian per user, detail transaksi
- ✅ **Admin Panel** — CRUD produk, kelola pesanan & status, lihat pengguna
- ✅ **Responsive** — Mobile & desktop (320px–1920px)
- ✅ **State Management** — LocalStorage untuk session, cart, orders

### Fitur Bonus
- ✅ **Dark Mode** — Toggle dengan persistensi, FOUC prevention
- ✅ **Wishlist** — Simpan produk favorit per user
- ✅ **Pagination** — 12 produk per halaman
- ✅ **Toast Notifications** — Notifikasi sukses/error/info

## 🛠️ Teknologi

| Teknologi | Keterangan |
|---|---|
| HTML5 | Struktur halaman |
| JavaScript ES6+ | Vanilla JS, ES Modules |
| Tailwind CSS | Styling via CDN |
| LocalStorage | Simulasi database |
| JSON | Data produk awal |

## 📁 Struktur File

```
rzstore/
├── index.html          # Landing page
├── shop.html           # Katalog produk
├── product.html        # Detail produk
├── cart.html           # Keranjang belanja
├── checkout.html       # Checkout
├── orders.html         # Riwayat pesanan
├── wishlist.html       # Wishlist
├── login.html          # Login & Register
├── admin.html          # Admin panel
├── css/
│   └── style.css       # Design system custom
├── js/
│   ├── app.js          # Shared utilities
│   ├── auth.js         # Authentication
│   ├── products.js     # Produk & katalog
│   ├── cart.js         # Keranjang
│   ├── checkout.js     # Checkout
│   ├── orders.js       # Riwayat pesanan
│   ├── wishlist.js     # Wishlist
│   └── admin.js        # Admin panel
└── data/
    └── products.json   # Data produk (22 produk)
```

## 🔑 Akun Default

| Role | Email | Password |
|---|---|---|
| Admin | admin@rzstore.com | admin123 |
| Customer | demo@rzstore.com | 123456 |

## 💻 Cara Menjalankan Lokal

### Opsi 1: Langsung buka di browser
```
Buka file index.html di browser
```
> ⚠️ Beberapa browser memblokir ES Modules dari `file://`. Gunakan opsi 2 jika ada masalah.

### Opsi 2: Gunakan live server (VS Code)
1. Install ekstensi **Live Server** di VS Code
2. Klik kanan `index.html` → **Open with Live Server**

### Opsi 3: Python HTTP Server
```bash
python -m http.server 8080
# Buka http://localhost:8080
```

### Opsi 4: Node.js
```bash
npx serve .
# Buka http://localhost:3000
```

## 🌐 Deploy ke GitHub Pages

1. Push semua file ke repository GitHub (pastikan **public**)
2. Buka **Settings** → **Pages**
3. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)`
4. Klik **Save**
5. Tunggu beberapa menit, lalu akses `https://username.github.io/nama-repo/`

> Format repo: `NamaDepan_NamaBelakang_UTS_Web2`

## 🗄️ LocalStorage Keys

| Key | Isi |
|---|---|
| `rz_products` | Array produk |
| `rz_users` | Array pengguna |
| `rz_session` | User yang sedang login |
| `rz_cart` | Item keranjang |
| `rz_orders` | Semua pesanan |
| `rz_wishlist` | Wishlist per email |
| `rz_theme` | Tema (light/dark) |

## 📸 Halaman

- **Beranda** — Hero, kategori, produk unggulan
- **Shop** — Grid produk + filter sidebar (kategori, harga, sort, search)
- **Detail Produk** — Info lengkap, qty selector, wishlist, produk serupa
- **Keranjang** — Manage item, summary harga
- **Checkout** — Form pengiriman, ringkasan pesanan
- **Pesanan** — Riwayat transaksi dengan detail expandable
- **Wishlist** — Produk tersimpan
- **Login/Register** — Tab toggle, validasi inline
- **Admin** — Dashboard stats, CRUD produk, kelola pesanan, lihat user

---

Made with ❤️ — UTS Pemrograman Web 2
