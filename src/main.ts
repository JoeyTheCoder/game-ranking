import './style.css';
import { Game } from './types';

// Use production API for local development
const API_BASE_URL = 'https://game-ratings.sapphirix.ch/api';

// Comment out the original line while developing
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3014';

// DOM elements
const gamesList = document.getElementById('gamesList') as HTMLDivElement;
const searchInput = document.getElementById('searchGames') as HTMLInputElement;
const platformFilter = document.getElementById('platformFilter') as HTMLSelectElement;
const ratingFilter = document.getElementById('ratingFilter') as HTMLSelectElement;
const template = document.getElementById('gameItemTemplate') as HTMLTemplateElement;

// State
let allGames: Game[] = [];
let platforms: string[] = [];

// Fetch games from API
async function fetchGames() {
  try {
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }
    
    allGames = await response.json();
    
    // Extract unique platforms for filter
    platforms = [...new Set(allGames.map(game => game.Platform))].sort();
    populatePlatformFilter();
    
    renderGames(allGames);
  } catch (error) {
    console.error('Error loading games:', error);
    gamesList.innerHTML = `
      <div class="text-center p-8 text-red-400">
        <i class="fas fa-exclamation-circle text-2xl mb-3"></i>
        <p>Failed to load games. Please try again later.</p>
      </div>
    `;
  }
}

// Populate platform filter dropdown
function populatePlatformFilter() {
  platforms.forEach(platform => {
    const option = document.createElement('option');
    option.value = platform;
    option.textContent = platform;
    platformFilter.appendChild(option);
  });
}

// Filter games based on search and filters
function filterGames() {
  const searchTerm = searchInput.value.toLowerCase();
  const platformValue = platformFilter.value;
  const ratingValue = parseFloat(ratingFilter.value);
  
  return allGames.filter(game => {
    const matchesSearch = game["Game Title"].toLowerCase().includes(searchTerm);
    const matchesPlatform = !platformValue || game.Platform === platformValue;
    const matchesRating = !ratingValue || parseFloat(game.Rating) >= ratingValue;
    
    return matchesSearch && matchesPlatform && matchesRating;
  });
}

// Render games to the DOM
function renderGames(games: Game[]) {
  gamesList.innerHTML = '';
  
  if (games.length === 0) {
    gamesList.innerHTML = `
      <div class="text-center p-8 text-gray-400">
        <p>No games found matching your criteria.</p>
      </div>
    `;
    return;
  }
  
  games.forEach(game => {
    const clone = template.content.cloneNode(true) as DocumentFragment;
    const gameItem = clone.querySelector('.game-item') as HTMLDivElement;
    
    // Set basic game info
    gameItem.querySelector('.game-title')!.textContent = game["Game Title"];
    gameItem.querySelector('.game-platform')!.textContent = game.Platform;
    gameItem.querySelector('.game-release')!.textContent = game.Release;
    
    // Set rating with color coding
    const ratingElem = gameItem.querySelector('.game-rating') as HTMLElement;
    const ratingValue = parseFloat(game.Rating);
    ratingElem.textContent = game.Rating;
    
    // Rating bar fill
    const ratingFill = gameItem.querySelector('.rating-fill') as HTMLElement;
    ratingFill.style.width = `${ratingValue * 10}%`;
    
    // Set color based on rating
    if (ratingValue >= 9) {
      ratingFill.classList.add('bg-green-500');
    } else if (ratingValue >= 8) {
      ratingFill.classList.add('bg-blue-500');
    } else if (ratingValue >= 7) {
      ratingFill.classList.add('bg-yellow-500');
    } else if (ratingValue >= 6) {
      ratingFill.classList.add('bg-orange-500');
    } else {
      ratingFill.classList.add('bg-red-500');
    }
    
    // Set completion details
    gameItem.querySelector('.game-beaten')!.textContent = game.Beaten === "TRUE" ? "✅" : "❌";
    gameItem.querySelector('.game-completion')!.textContent = game.Completion;
    
    // Set comments
    gameItem.querySelector('.game-comments')!.textContent = game.Comments || "No comments available.";
    
    // Add platform completion icons
    const platformsElem = gameItem.querySelector('.completion-platforms') as HTMLElement;
    if (game["100% Xbox"] === "TRUE") {
      addPlatformIcon(platformsElem, 'xbox', 'Xbox');
    }
    if (game["100% PS"] === "TRUE") {
      addPlatformIcon(platformsElem, 'playstation', 'PlayStation');
    }
    if (game["100% PC"] === "TRUE") {
      addPlatformIcon(platformsElem, 'desktop', 'PC');
    }
    if (game["100% Nintendo"] === "TRUE") {
      addPlatformIcon(platformsElem, 'gamepad', 'Nintendo');
    }
    
    // Add score details
    const scoresElem = gameItem.querySelector('.scores div') as HTMLElement;
    addScoreBar(scoresElem, 'Gameplay', game.Gameplay, game["Factor Gameplay"]);
    addScoreBar(scoresElem, 'World/Setting', game["World/Setting"], game["Factor World / Setting"]);
    addScoreBar(scoresElem, 'Story', game["Story / Progression"], game["Factor Story"]);
    addScoreBar(scoresElem, 'Replayability', game.Replayability, game["Factor Replayability"]);
    addScoreBar(scoresElem, 'Graphics', game.Graphics, game["Factor Graphics"]);
    addScoreBar(scoresElem, 'Sound/Music', game["Sound/Music"], game["Factor Sound/Music"]);
    addScoreBar(scoresElem, 'Nostalgia', game.Nostalgia, game["Factor Nostalgia Factor"]);
    
    // Handle expand/collapse
    const headerElem = gameItem.querySelector('.game-header') as HTMLElement;
    const detailsElem = gameItem.querySelector('.game-details') as HTMLElement;
    const expandBtn = gameItem.querySelector('.expand-btn') as HTMLButtonElement;
    
    headerElem.addEventListener('click', () => {
      detailsElem.classList.toggle('hidden');
      const icon = expandBtn.querySelector('i')!;
      icon.classList.toggle('fa-chevron-down');
      icon.classList.toggle('fa-chevron-up');
    });
    
    gamesList.appendChild(clone);
  });
}

// Helper function to add platform icon
function addPlatformIcon(container: HTMLElement, icon: string, title: string) {
  const iconElem = document.createElement('span');
  iconElem.innerHTML = `<i class="fas fa-${icon} mr-2" title="${title}"></i>`;
  iconElem.className = 'text-green-500';
  container.appendChild(iconElem);
}

// Helper function to add score bar
function addScoreBar(container: HTMLElement, label: string, score: string, factor: string) {
  if (!score) return;
  
  const scoreValue = parseFloat(score);
  const factorValue = parseFloat(factor);
  
  const scoreElem = document.createElement('div');
  scoreElem.className = 'score-item';
  scoreElem.innerHTML = `
    <div class="flex justify-between items-center mb-1">
      <span class="text-sm">${label}</span>
      <div class="flex items-center">
        <span class="text-sm mr-1">${score}</span>
        ${factorValue ? `<span class="text-xs text-gray-400">(${factor}x)</span>` : ''}
      </div>
    </div>
    <div class="w-full bg-gray-700 rounded-full h-1.5">
      <div class="h-full rounded-full" style="width: ${scoreValue * 10}%"></div>
    </div>
  `;
  
  // Set color based on score
  const barFill = scoreElem.querySelector('.h-full') as HTMLElement;
  if (scoreValue >= 9) {
    barFill.classList.add('bg-green-500');
  } else if (scoreValue >= 8) {
    barFill.classList.add('bg-blue-500');
  } else if (scoreValue >= 7) {
    barFill.classList.add('bg-yellow-500');
  } else if (scoreValue >= 6) {
    barFill.classList.add('bg-orange-500');
  } else {
    barFill.classList.add('bg-red-500');
  }
  
  container.appendChild(scoreElem);
}

// Add event listeners for filters
searchInput.addEventListener('input', () => {
  renderGames(filterGames());
});

platformFilter.addEventListener('change', () => {
  renderGames(filterGames());
});

ratingFilter.addEventListener('change', () => {
  renderGames(filterGames());
});

// Load data once the page is fully loaded
document.addEventListener('DOMContentLoaded', fetchGames);
