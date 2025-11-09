// src/components/footer.js
export default function FooterComponent() {
  const footer = document.createElement("footer");
  footer.className = "footer";

  footer.innerHTML = `
    <div class="container footer-content">
      <div class="footer-logo">
        <i class="fa-solid fa-mug-hot"></i>
        <span>Es Cokelat</span>
      </div>
      <p class="footer-tagline">Nikmati kesegaran cokelat setiap hari 🍫</p>

      <nav class="footer-links" aria-label="Tautan footer">
        <a href="#/home">Menu</a>
        <a href="#/map">Lokasi Toko</a>
        <a href="#/add">Pesan Sekarang</a>
        <a href="#/settings">Pengaturan</a>
      </nav>

      <p class="footer-credit">
        Dibuat dengan 💖 oleh <span class="author-name">Sharon Sianturi</span>
      </p>

      <p class="footer-copy">© ${new Date().getFullYear()} Es Cokelat. Semua hak dilindungi.</p>
    </div>
  `;

  return footer;
}
