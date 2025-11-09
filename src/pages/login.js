// src/pages/login.js
import FooterComponent from "../components/footer";
import { AuthService } from "../utils/authService";

export default function LoginComponent() {
  const container = document.createElement("div");

  container.innerHTML = `
    <header class="navbar">
      <div class="container navbar-content">
        <div class="brand-logo">
          <span class="logo-icon" aria-hidden="true">🍫</span>
          <span>Es Cokelat</span>
        </div>
        <a class="btn outline" href="#/register">Buat Akun Baru</a>
      </div>
    </header>

    <main class="auth-container container">
      <section class="auth-panel">
        <h1>Masuk ke Es Cokelat</h1>
        <p style="text-align:center; color: var(--text-muted); margin-bottom: 1rem;">
          Nikmati segelas kebahagiaan — login untuk mulai memesan minuman favoritmu ☕
        </p>
        <form id="loginForm" novalidate>
          <div class="form-field">
            <label for="userEmail">Email</label>
            <input id="userEmail" name="email" type="email" autocomplete="email" required placeholder="contoh@escokelat.com">
          </div>
          <div class="form-field">
            <label for="userPassword">Kata Sandi</label>
            <input id="userPassword" name="password" type="password" autocomplete="current-password" required placeholder="••••••••">
          </div>
          <button class="btn primary" type="submit">Masuk</button>
          <div class="error-message" id="errorDisplay" role="alert" aria-live="polite" style="display:none"></div>
        </form>
      </section>
    </main>
  `;

  container.appendChild(FooterComponent());
  const loginForm = container.querySelector("#loginForm");
  const errorElement = container.querySelector("#errorDisplay");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailInput = container.querySelector("#userEmail").value.trim();
    const passwordInput = container.querySelector("#userPassword").value;

    try {
      await AuthService.signIn({ email: emailInput, password: passwordInput });
      window.location.hash = "#/home";
    } catch (error) {
      errorElement.textContent =
        error.message || "Terjadi kesalahan saat login, coba lagi.";
      errorElement.style.display = "block";
    }
  });

  return container;
}
