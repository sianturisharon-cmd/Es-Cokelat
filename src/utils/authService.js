// src/services/authService.js
const API_BASE_URL = "https://story-api.dicoding.dev/v1";

export const AuthService = {
  checkAuthStatus() {
    return !!localStorage.getItem("auth_token");
  },

  async signIn({ email, password }) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || "Proses login gagal");
    }
    
    localStorage.setItem("auth_token", responseData.loginResult.token);
    localStorage.setItem("user_data", JSON.stringify(responseData.loginResult));
  },

  async registerUser({ name, email, password }) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || "Pendaftaran gagal");
    }
  },

  signOut() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
  },
};

export async function submitNewStory({ description, photoFile, lat, lon }) {
  const authToken = localStorage.getItem("auth_token");
  
  if (!authToken) {
    throw new Error("Anda harus login terlebih dahulu");
  }

  const formData = new FormData();
  formData.append("description", description);

  if (photoFile) {
    const fileName = (photoFile instanceof File && photoFile.name) ? 
      photoFile.name : "captured_image.jpg";
    formData.append("photo", photoFile, fileName);
  }

  if (typeof lat === "number") formData.append("lat", lat);
  if (typeof lon === "number") formData.append("lon", lon);

  const response = await fetch(`${API_BASE_URL}/stories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData,
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || "Gagal menambah cerita");
  }
  
  return responseData;
}

export async function fetchStories() {
  const authToken = localStorage.getItem("auth_token");
  
  if (!authToken) {
    throw new Error("Anda harus login terlebih dahulu");
  }

  const response = await fetch(`${API_BASE_URL}/stories?size=30`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || "Gagal mengambil data cerita");
  }

  const storiesList = responseData.list ?? responseData.listStory ?? responseData.stories ?? [];
  return { stories: storiesList };
}