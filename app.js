// elements
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const cardsContainer = document.getElementById('cardsContainer');
const mealsContainer = document.getElementById('mealsContainer');
const categoryDetails = document.getElementById('categoryDetails');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const homeBtn = document.getElementById('homeBtn');

const categoriesData = {}; // store category descriptions

// helpers
const escapeHtml = s =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function closeMenu() {
  sideMenu.classList.remove('open');
  overlay.classList.remove('show');
  setTimeout(() => { overlay.hidden = true; }, 220);
}

// menu open/close
menuBtn?.addEventListener('click', () => {
  sideMenu.classList.add('open');
  overlay.hidden = false;
  overlay.classList.add('show');
});
closeBtn?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);

// HOME button
homeBtn?.addEventListener('click', () => {
  categoryDetails.hidden = true;
  mealsContainer.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// load categories & populate grid + side menu entries (single render)
async function loadCategories() {
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
    const data = await res.json();
    if (!data?.categories?.length) return;

    // build cards HTML
    const cardsHtml = data.categories.map(cat => {
      categoriesData[cat.strCategory] = cat.strCategoryDescription || '';
      return `
        <div class="card" data-cat="${escapeHtml(cat.strCategory)}">
          <img src="${cat.strCategoryThumb}" alt="${escapeHtml(cat.strCategory)}">
          <h3>${escapeHtml(cat.strCategory)}</h3>
        </div>`;
    }).join('');
    cardsContainer.innerHTML = cardsHtml;

    // build side menu items (if ul exists inside sideMenu)
    const ul = sideMenu?.querySelector('ul');
    if (ul) {
      ul.innerHTML = data.categories.map(cat => `<li>${escapeHtml(cat.strCategory)}</li>`).join('');
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

// event delegation: card click -> open category
cardsContainer?.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  const cat = card?.getAttribute('data-cat');
  if (cat) openCategory(cat);
});

// event delegation: side menu item click -> open category
sideMenu?.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (li) openCategory(li.textContent.trim());
});

// open a category: show description and list of meals
async function openCategory(catName) {
  categoryDetails.hidden = false;
  categoryDetails.innerHTML = `<h2>${escapeHtml(catName)}</h2><p>${escapeHtml(categoriesData[catName] || '')}</p>`;

  mealsContainer.innerHTML = 'Loading...';
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(catName)}`);
    const d = await res.json();
    if (!d?.meals?.length) {
      mealsContainer.innerHTML = `<div class="no-found">No meals found for ${escapeHtml(catName)}</div>`;
      return;
    }

    const html = d.meals.slice(0, 50).map(m => `
      <div class="meal-card" data-id="${m.idMeal}">
        <div class="thumb-wrap">
          <img src="${m.strMealThumb}" alt="${escapeHtml(m.strMeal)}">
          <span class="cat-badge">${escapeHtml(catName)}</span>
        </div>
        <div class="meal-info">
          <h3 class="meal-title">${escapeHtml(m.strMeal)}</h3>
        </div>
      </div>`).join('');

    mealsContainer.innerHTML = html;
    closeMenu(); // close side menu for better UX
    // attach click via delegation (below)
  } catch (err) {
    console.error('Failed to load category meals', err);
    mealsContainer.innerHTML = '<div class="no-found">Failed to load meals.</div>';
  }

  // smooth scroll to details
  setTimeout(() => {
    window.scrollTo({ top: Math.max(0, categoryDetails.offsetTop - 20), behavior: 'smooth' });
  }, 50);
}

// event delegation: click on meal-card to show details
mealsContainer?.addEventListener('click', (e) => {
  const card = e.target.closest('.meal-card');
  const id = card?.getAttribute('data-id');
  if (id) showMealById(id);
});

// show meal details by id using lookup.php
async function showMealById(id) {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`);
    const d = await res.json();
    const m = d?.meals?.[0];
    if (!m) return;

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = m[`strIngredient${i}`];
      const measure = m[`strMeasure${i}`];
      if (ing?.trim()) ingredients.push({ ing: ing.trim(), measure: (measure || '').trim() });
    }

    categoryDetails.hidden = false;
    categoryDetails.innerHTML = `
      <div class="breadcrumb" style="background:#E85A0C;color:#fff;padding:8px 12px;border-radius:4px;margin-bottom:12px;">
        <span style="font-weight:700"></span> &nbsp; ${escapeHtml(m.strMeal)} ${m.strArea ? `(${escapeHtml(m.strArea)})` : ''}
      </div>

      <div class="detail-grid">
        <div>
          <img class="detail-img" src="${escapeHtml(m.strMealThumb || '')}" alt="${escapeHtml(m.strMeal)}">
        </div>

        <div style="flex:1">
          <h2 style="margin-top:0;color:#E85A0C">${escapeHtml(m.strMeal)}</h2>
          <p><strong>Category:</strong> ${escapeHtml(m.strCategory || '')} ${m.strArea ? ' • ' + escapeHtml(m.strArea) : ''}</p>
          <p><strong>Source:</strong> ${m.strSource ? `<a href="${escapeHtml(m.strSource)}" target="_blank" rel="noopener">source</a>` : '—'}</p>

          <div style="margin-top:12px" class="ingredients-box">
            <h4>Ingredients</h4>
            <ul class="ingredients-list">
              ${ingredients.map(it => `<li>${escapeHtml(it.ing)}${it.measure ? ' — ' + escapeHtml(it.measure) : ''}</li>`).join('')}
            </ul>
          </div>

          <div class="measure-box" style="margin-top:14px">
            ${ingredients.map(it => `<div class="measure-item">${escapeHtml(it.measure || '')} <span style="display:block;font-weight:700">${escapeHtml(it.ing)}</span></div>`).join('')}
          </div>
        </div>
      </div>

      <div style="margin-top:18px">
        <h3 style="margin:0 0 8px 0">Instructions</h3>
        <p style="line-height:1.6">${escapeHtml(m.strInstructions || '')}</p>
      </div>
    `;

    window.scrollTo({ top: Math.max(0, categoryDetails.offsetTop - 20), behavior: 'smooth' });
  } catch (err) {
    console.error('Failed to fetch meal details', err);
  }
}

// search (simple: show first match; click it for full details)
searchBtn?.addEventListener('click', async () => {
  const q = (searchInput.value || '').trim();
  if (!q) return;
  categoryDetails.hidden = true;
  mealsContainer.innerHTML = 'Searching...';
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
    const d = await res.json();
    if (!d?.meals?.length) {
      mealsContainer.innerHTML = `<div class="no-found">No meal found!</div>`;
      return;
    }
    const m = d.meals[0];
    mealsContainer.innerHTML = `
      <div class="meal-card" data-id="${m.idMeal}">
        <div class="thumb-wrap"><img src="${m.strMealThumb}" alt="${escapeHtml(m.strMeal)}"><span class="cat-badge">${escapeHtml(m.strCategory)}</span></div>
        <div class="meal-info"><h3 class="meal-title">${escapeHtml(m.strMeal)}</h3></div>
      </div>`;
  } catch (err) {
    console.error('Search failed', err);
    mealsContainer.innerHTML = '<div class="no-found">Search failed.</div>';
  }
});

// init
loadCategories();
