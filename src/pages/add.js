// src/pages/add.js
import NavigationBar from "../components/navbar";
import { submitNewStory } from "../utils/authService";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import FooterComponent from "../components/footer";

L.Marker.prototype.options.icon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AddStoryPage() {
  const pageContainer = document.createElement("div");
  pageContainer.appendChild(NavigationBar());

  const mainContent = document.createElement("main");
  mainContent.className = "container";
  mainContent.innerHTML = `
    <h1>Tambah Menu Baru 🍫</h1>

    <section class="form-panel" aria-label="Pilih lokasi kedai">
      <div id="locationMap" class="map-container"></div>
      <p class="help-text">Klik peta untuk menentukan lokasi kedai Es Cokelat Anda.</p>
    </section>

    <section class="form-panel" aria-label="Form tambah menu">
      <form id="storyForm" aria-describedby="formHelp" novalidate>
        <div class="form-field">
          <label for="storyDescription">Deskripsi Minuman</label>
          <textarea id="storyDescription" rows="3" required placeholder="Ceritakan rasa, aroma, atau topping spesial..."></textarea>
        </div>

        <div class="form-field">
          <label for="photoUpload">Foto Minuman (unggah atau gunakan kamera)</label>
          <input id="photoUpload" type="file" accept="image/*">
          <div class="camera-controls">
            <button type="button" id="openCamera" class="btn secondary">📸 Buka Kamera</button>
            <button type="button" id="capturePhoto" class="btn" disabled>📷 Ambil Foto</button>
            <button type="button" id="closeCamera" class="btn outline" disabled>📴 Tutup Kamera</button>
          </div>
          <video id="cameraPreview" autoplay playsinline style="display:none;"></video>
          <canvas id="photoCanvas" width="640" height="480" style="display:none"></canvas>
          <img id="capturedImage" alt="Hasil foto dari kamera" style="display:none;">
          <p class="help-text" aria-live="polite" id="cameraStatus"></p>
        </div>

        <div class="form-field">
          <label for="latitudeInput">Garis Lintang (Latitude)</label>
          <input id="latitudeInput" placeholder="Latitude" required inputmode="decimal">
        </div>
        <div class="form-field">
          <label for="longitudeInput">Garis Bujur (Longitude)</label>
          <input id="longitudeInput" placeholder="Longitude" required inputmode="decimal">
        </div>

        <div class="help-text" id="formHelp">Koordinat akan otomatis terisi setelah Anda memilih lokasi di peta.</div>

        <button class="btn primary" type="submit">Simpan Menu</button>
      </form>
      <p class="help-text" id="formMessage" aria-live="polite"></p>
    </section>
  `;

  pageContainer.appendChild(mainContent);
  pageContainer.appendChild(FooterComponent());

  const mapElement = mainContent.querySelector("#locationMap");
  const mapInstance = L.map(mapElement).setView([-6.2, 106.8], 11);

  const openStreetMap = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }
  ).addTo(mapInstance);

  const darkMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { maxZoom: 19, attribution: "&copy; CartoDB" }
  );

  L.control
    .layers({ "Peta Standar": openStreetMap, "Peta Gelap": darkMap })
    .addTo(mapInstance);

  let locationMarker = null;
  mapInstance.on("click", (event) => {
    const { lat, lng } = event.latlng;
    mainContent.querySelector("#latitudeInput").value = lat.toFixed(6);
    mainContent.querySelector("#longitudeInput").value = lng.toFixed(6);
    if (locationMarker) {
      locationMarker.setLatLng(event.latlng);
    } else {
      locationMarker = L.marker(event.latlng)
        .addTo(mapInstance)
        .bindPopup("Lokasi kedai dipilih");
    }
  });

  let cameraStream = null;
  let capturedImageBlob = null;

  const cameraElements = {
    openButton: mainContent.querySelector("#openCamera"),
    captureButton: mainContent.querySelector("#capturePhoto"),
    closeButton: mainContent.querySelector("#closeCamera"),
    preview: mainContent.querySelector("#cameraPreview"),
    canvas: mainContent.querySelector("#photoCanvas"),
    image: mainContent.querySelector("#capturedImage"),
    fileInput: mainContent.querySelector("#photoUpload"),
    status: mainContent.querySelector("#cameraStatus"),
  };

  async function initializeCamera() {
    if (cameraStream) return;
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraElements.preview.srcObject = cameraStream;
      cameraElements.preview.style.display = "block";
      cameraElements.captureButton.disabled = false;
      cameraElements.closeButton.disabled = true;
      cameraElements.status.textContent =
        "Kamera aktif. Klik 'Ambil Foto' untuk memotret minuman.";
      cameraElements.preview.onplaying = () => {
        cameraElements.closeButton.disabled = false;
      };
    } catch (error) {
      cameraElements.status.textContent =
        "Tidak dapat mengakses kamera: " + error.message;
    }
  }

  function terminateCamera() {
    if (!cameraStream) return;
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraElements.preview.srcObject = null;
    cameraElements.preview.style.display = "none";
    cameraElements.captureButton.disabled = true;
    cameraElements.closeButton.disabled = true;
    cameraElements.status.textContent = "Kamera dimatikan.";
  }

  async function captureImage() {
    if (!cameraElements.preview.srcObject) return;
    const context = cameraElements.canvas.getContext("2d");
    cameraElements.canvas.width = cameraElements.preview.videoWidth || 640;
    cameraElements.canvas.height = cameraElements.preview.videoHeight || 480;
    context.drawImage(cameraElements.preview, 0, 0);
    const imageBlob = await new Promise((resolve) =>
      cameraElements.canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    capturedImageBlob = imageBlob;
    cameraElements.image.src = URL.createObjectURL(imageBlob);
    cameraElements.image.style.display = "block";
    cameraElements.status.textContent = "Foto berhasil diambil!";
  }

  cameraElements.openButton.addEventListener("click", initializeCamera);
  cameraElements.closeButton.addEventListener("click", terminateCamera);
  cameraElements.captureButton.addEventListener("click", captureImage);

  const storyForm = mainContent.querySelector("#storyForm");
  const formMessage = mainContent.querySelector("#formMessage");

  storyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const descriptionText = mainContent
      .querySelector("#storyDescription")
      .value.trim();
    const latitudeValue = parseFloat(
      mainContent.querySelector("#latitudeInput").value
    );
    const longitudeValue = parseFloat(
      mainContent.querySelector("#longitudeInput").value
    );
    const imageFile = cameraElements.fileInput.files[0] || capturedImageBlob;

    if (!imageFile) {
      cameraElements.status.textContent =
        "Silakan pilih atau ambil foto minuman terlebih dahulu.";
      return;
    }

    if (Number.isNaN(latitudeValue) || Number.isNaN(longitudeValue)) {
      formMessage.textContent = "Pilih lokasi kedai di peta sebelum menyimpan.";
      return;
    }

    try {
      await submitNewStory({
        description: descriptionText,
        photoFile: imageFile,
        lat: latitudeValue,
        lon: longitudeValue,
      });
      formMessage.textContent = "Menu Es Cokelat berhasil ditambahkan!";
      terminateCamera();
      window.location.hash = "#/map";
    } catch (error) {
      console.error(error);
      formMessage.textContent =
        error.message || "Terjadi kesalahan saat menyimpan data.";
    }
  });

  return pageContainer;
}
