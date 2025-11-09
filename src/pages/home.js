// src/pages/home.js
import NavigationBar from "../components/navbar";
import { fetchStories } from "../utils/authService";
import createStoryCard from "../components/storyCard";
import FooterComponent from "../components/footer";

export default function HomePageComponent() {
  const pageContainer = document.createElement("div");
  pageContainer.appendChild(NavigationBar());

  const mainContent = document.createElement("main");
  mainContent.className = "container";
  mainContent.innerHTML = `
    <h1 class="page-title">Menu Es Cokelat Spesial</h1>
    <p class="subtitle-text">Nikmati berbagai varian es cokelat segar kami 🍫❄️</p>

    <div id="menuContainer" class="menu-grid"></div>
    <p id="statusMessage" class="status-text"></p>
  `;

  pageContainer.appendChild(mainContent);
  pageContainer.appendChild(FooterComponent());

  const menuContainer = mainContent.querySelector("#menuContainer");
  const statusMessage = mainContent.querySelector("#statusMessage");

  async function loadMenuData() {
    try {
      const { stories } = await fetchStories(); // masih pakai endpoint yang sama, bisa diubah jadi fetchMenu() nanti

      if (!stories.length) {
        statusMessage.textContent =
          "Belum ada menu tersedia. Silakan kembali lagi nanti!";
        return;
      }

      stories.forEach((menuItem) => {
        const card = createStoryCard(menuItem); // komponen ini bisa kamu ubah tampilannya nanti jadi kartu menu

        card.addEventListener("click", () => {
          localStorage.setItem("highlightedLat", menuItem.lat);
          localStorage.setItem("highlightedLon", menuItem.lon);
          localStorage.setItem("highlightedId", menuItem.id);
          window.location.hash = "#/map";
        });

        menuContainer.appendChild(card);
      });
    } catch (error) {
      statusMessage.textContent =
        "Gagal memuat menu. Silakan periksa koneksi Anda atau login ulang.";
      console.error(error);
    }
  }

  loadMenuData();
  return pageContainer;
}
