// src/pages/map.js
import NavigationBar from "../components/navbar";
import { fetchStories } from "../utils/authService"; // masih pakai endpoint lama, bisa nanti diubah jadi fetchOutlets()
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import FooterComponent from "../components/footer";

// Konfigurasi ikon marker
L.Marker.prototype.options.icon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapPageComponent() {
  const pageContainer = document.createElement("div");
  pageContainer.appendChild(NavigationBar());

  const mainContent = document.createElement("main");
  mainContent.className = "container";
  mainContent.innerHTML = `
    <h1 class="page-title">Peta Cabang Es Cokelat</h1>
    <p class="subtitle-text">Temukan kedai Es Cokelat terdekat dari lokasi Anda 🍹</p>

    <section class="map-panel" aria-label="Peta lokasi cabang Es Cokelat">
      <div id="storiesMap" class="map-container" role="region" aria-label="Peta cabang"></div>
      <p class="help-text" id="mapStatus"></p>
    </section>
  `;

  pageContainer.appendChild(mainContent);
  pageContainer.appendChild(FooterComponent());
  const mapElement = mainContent.querySelector("#storiesMap");
  const statusMessage = mainContent.querySelector("#mapStatus");
  const markersLayer = L.layerGroup();

  const mapInstance = L.map(mapElement, { zoomControl: true }).setView(
    [-6.2, 106.8], // default: Jakarta
    12
  );

  // Layer peta
  const openStreetMap = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }
  ).addTo(mapInstance);

  const darkMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      maxZoom: 19,
      attribution: "&copy; CartoDB",
    }
  );

  L.control
    .layers({ "Peta Standar": openStreetMap, "Peta Gelap": darkMap })
    .addTo(mapInstance);

  markersLayer.addTo(mapInstance);

  // Pastikan peta responsif
  mapInstance.whenReady(() =>
    setTimeout(() => mapInstance.invalidateSize(), 0)
  );
  requestAnimationFrame(() => mapInstance.invalidateSize());
  window.addEventListener("resize", () => mapInstance.invalidateSize(), {
    passive: true,
  });

  const highlightedStoryId = localStorage.getItem("highlightedId");

  async function loadOutletLocations() {
    markersLayer.clearLayers();

    try {
      const { stories } = await fetchStories();

      if (!stories.length) {
        statusMessage.textContent = "Belum ada cabang terdaftar saat ini.";
        return;
      }

      let focusedMarker = null;

      stories.forEach((outlet) => {
        if (typeof outlet.lat === "number" && typeof outlet.lon === "number") {
          const popupContent = `
            <b>${outlet.name || "Cabang Es Cokelat"}</b><br>
            ${outlet.description || "Cabang resmi Es Cokelat"}<br>
            ${
              outlet.photoUrl
                ? `<img src="${outlet.photoUrl}" alt="Foto cabang" 
                    style="max-width:140px;border-radius:8px;margin-top:6px;">`
                : ""
            }
          `;

          const marker = L.marker([outlet.lat, outlet.lon])
            .addTo(markersLayer)
            .bindPopup(popupContent);

          if (highlightedStoryId && outlet.id === highlightedStoryId) {
            focusedMarker = marker;
          }
        }
      });

      if (focusedMarker) {
        mapInstance.setView(focusedMarker.getLatLng(), 14);
        focusedMarker.openPopup();

        const highlightCircle = L.circle(focusedMarker.getLatLng(), {
          radius: 150,
          color: "#8b4513", // warna cokelat khas Es Cokelat
        }).addTo(mapInstance);

        setTimeout(() => mapInstance.removeLayer(highlightCircle), 1500);
      }

      localStorage.removeItem("highlightedId");
      statusMessage.textContent = "";
    } catch (error) {
      statusMessage.textContent =
        "Gagal memuat data lokasi. Silakan coba lagi nanti.";
      console.error(error);
    }
  }

  loadOutletLocations();
  return pageContainer;
}
