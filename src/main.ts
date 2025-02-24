async function fetchGames() {
  try {
      const response = await fetch("http://localhost:3000/games");
      const games = await response.json();
      console.log("🔹 Fetched games:", games);

      const tableBody = document.getElementById("gameTableBody");
      if (!tableBody) return;
      tableBody.innerHTML = "";

      games.forEach((game: any) => {
          const row = document.createElement("tr");
          row.className = "border-b border-gray-700 hover:bg-gray-700";
          row.innerHTML = `
              <td class="p-3">${game["Game Title"] || "Unknown"}</td>
              <td class="p-3">${game.Platform || "Unknown"}</td>
              <td class="p-3">${game.Release || "N/A"}</td>
              <td class="p-3">${game.Rating || "N/A"}</td>
              <td class="p-3">${game.Beaten || "N/A"}</td>
              <td class="p-3">${game.Completion || "N/A"}</td>
              <td class="p-3">${game.Comments || ""}</td>
          `;
          tableBody.appendChild(row);
      });
  } catch (error) {
      console.error("❌ Error loading games:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchGames);
