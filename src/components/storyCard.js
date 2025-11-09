// src/components/storyCard.js
export default function createStoryCard(drinkItem) {
  const cardElement = document.createElement("article");
  cardElement.className = "story-card";

  const imageUrl =
    drinkItem.photoUrl ||
    "https://placehold.co/600x400?text=Es+Cokelat+Favorit";
  const drinkName = drinkItem.name || "Es Cokelat Original";

  cardElement.innerHTML = `
    <img src="${imageUrl}" alt="Foto minuman ${drinkName}">
    <div class="card-content">
      <div class="author-name">${drinkName}</div>
      <div class="post-date">${new Date(
        drinkItem.createdAt
      ).toLocaleDateString()}</div>
      <p class="story-description">
        ${
          drinkItem.description ||
          "Rasakan kenikmatan cokelat premium dengan es yang menyegarkan!"
        }
      </p>
      ${
        typeof drinkItem.lat === "number"
          ? `<p class="location-meta">Lokasi cabang: ${drinkItem.lat}, ${drinkItem.lon}</p>`
          : ""
      }
    </div>`;

  return cardElement;
}
