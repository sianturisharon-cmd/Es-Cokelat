// src/components/navbar.js
import { AuthService } from "../utils/authService";
import logo from "../assets/logo.jpg";

export default function NavigationBar() {
  const navElement = document.createElement("nav");
  navElement.className = "navbar";

  navElement.innerHTML = `
    <div class="container navbar-content">
      <div class="brand-logo">
        <img class="logo-img" src="${logo}" alt="Logo Es Cokelat" width="28" height="28">
        <span>Es Cokelat</span>
      </div>
      <div class="navigation-actions">
        <a class="btn outline" href="#/home">Menu</a>
        <a class="btn outline" href="#/map">Lokasi Toko</a>
        <a class="btn outline" href="#/add">Pesan Sekarang</a>
        <a class="btn outline" href="#/settings">Tentang Kami</a>
        <button class="btn secondary" id="logoutButton" type="button">Keluar</button>
      </div>
    </div>`;

  navElement.querySelector("#logoutButton").addEventListener("click", () => {
    AuthService.signOut();
    window.location.hash = "#/login";
  });

  return navElement;
}
