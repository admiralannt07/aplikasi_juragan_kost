# 🎨 Assets Folder

Folder ini berisi file-file statis untuk frontend SULTAN Dashboard.

## 📁 Struktur

```
assets/
└── favicon.png       # Icon yang muncul di browser tab (512x512px)
```

## 🖼️ Favicon

- **File**: `favicon.png`
- **Ukuran**: 512x512 pixels
- **Format**: PNG dengan transparency
- **Desain**: Golden crown icon pada background navy blue (#0f172a)
- **Digunakan di**: 
  - `index.html` (Dashboard)
  - `login.html` (Login Page)

## 💡 Cara Menambah Asset Baru

1. Simpan file di folder `assets/`
2. Reference di HTML dengan path relatif:
   ```html
   <img src="assets/nama-file.png" alt="Description">
   ```

## 🎯 Best Practices

- Gunakan nama file yang deskriptif (lowercase, dengan dash)
- Compress gambar sebelum upload untuk performa optimal
- Gunakan format yang sesuai:
  - **PNG**: untuk logo, icon, gambar dengan transparency
  - **JPG**: untuk foto
  - **SVG**: untuk icon yang scalable
