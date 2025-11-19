// OPEN & CLOSE MENU
menuBtn.onclick = () => sideMenu.classList.add("open");
closeBtn.onclick = () => sideMenu.classList.remove("open");

//ASYNC FUNCTION
async function loadCategories() {
    const res = await fetch("https://www.themealdb.com/api/json/v1/1/categories.php");
    const data = await res.json();

    data.categories.forEach(cat => {
        cardsContainer.innerHTML += `
            <div class="card">
                <img src="${cat.strCategoryThumb}">
                <h3>${cat.strCategory}</h3>
            </div>
        `;
    });
}

loadCategories();
const input = document.querySelector(".search-area input");
const btn = document.querySelector(".search-btn");
const results = document.getElementById("searchResults");

btn.onclick = function () {

    let food = input.value;

    fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + food)
        .then(res => res.json())
        .then(data => {

            results.innerHTML = ""; // clear old

            if (!data.meals) {
                results.innerHTML = "No meal found!";
                return;
            }

            // Show ONLY meal name (very simple)
            results.innerHTML = data.meals[0].strMeal;
        });

};