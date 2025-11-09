// src/utils/router.js
import HomePageComponent from "../pages/home";
import LoginComponent from "../pages/login";
import RegisterComponent from "../pages/register";
import MapPageComponent from "../pages/map";
import AddStoryPage from "../pages/add";
import SettingsPage from "../pages/settings";

const applicationRoutes = {
  "#/login": LoginComponent,
  "#/register": RegisterComponent,
  "#/home": HomePageComponent,
  "#/map": MapPageComponent,
  "#/add": AddStoryPage,
  "#/settings": SettingsPage,
};

function renderComponent(Component) {
  const appRoot = document.querySelector("#app");
  
  const updateView = () => {
    appRoot.innerHTML = "";
    appRoot.appendChild(Component());
  };
  
  if (document.startViewTransition) {
    document.startViewTransition(updateView);
  } else {
    updateView();
  }
}

function renderCurrentRoute() {
  const currentHash = window.location.hash || "#/login";
  const routePath = currentHash.split("?")[0];
  const RouteComponent = applicationRoutes[routePath] || LoginComponent;
  
  renderComponent(RouteComponent);
}

export function initializeRouter() {
  if (!window.location.hash) {
    window.location.hash = "#/login";
  }
  
  window.addEventListener("hashchange", renderCurrentRoute);
  renderCurrentRoute();
}