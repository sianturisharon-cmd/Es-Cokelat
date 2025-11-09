// src/index.js
import "./styles/main.css";
import "leaflet/dist/leaflet.css";
import { initializeRouter } from "./utils/router";

export function performPageTransition(callback) {
  try {
    document.startViewTransition ? 
      document.startViewTransition(callback) : 
      callback();
  } catch {
    callback();
  }
}

initializeRouter();