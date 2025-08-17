
const allergenSelect = document.getElementById('allergen-select');
const addBtn = document.getElementById('add-allergen');
const allergenList = document.getElementById('allergen-list');
const submitBtn = document.getElementById('submit-allergens');

let allergens = [];

addBtn.addEventListener('click', () => {
    const selected = allergenSelect.value;
    if (selected && !allergens.includes(selected)) {
        allergens.push(selected);

        const tag = document.createElement('div');
        tag.className = 'bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2';
        tag.textContent = selected;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.className = 'ml-2';
        removeBtn.onclick = () => {
            allergens = allergens.filter(a => a !== selected);
            allergenList.removeChild(tag);
        };

        tag.appendChild(removeBtn);
        allergenList.appendChild(tag);
    }
});

submitBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ allergens }, () => {
        alert('Your allergen preferences have been saved!');
    });
});

window.onload = function () {
    let index = 0;
    const slides = document.querySelectorAll(".slide");
    const dots = document.querySelectorAll(".dot");
    const totalSlides = slides.length;

    function nextSlide() {
        index = (index + 1) % totalSlides;
        updateCarousel();
    }

    function prevSlide() {
        index = (index - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    function setSlide(n) {
        index = n;
        updateCarousel();
    }

    function updateCarousel() {
        document.querySelector(".carousel-container").style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot) => dot.classList.remove("active"));
        dots[index].classList.add("active");
    }

    // Automatically go to next slide every 3 seconds
    setInterval(nextSlide, 3000);

    // Attach the button click events (good practice)
    document.querySelector('.prev').onclick = prevSlide;
    document.querySelector('.next').onclick = nextSlide;
    dots.forEach((dot, idx) => {
        dot.onclick = () => setSlide(idx);
    });
};

// Initialize an empty array to store selected allergens
let selectedAllergens = [];

// Function to add an allergen
function addAllergen(allergen) {
    if (!selectedAllergens.includes(allergen)) {
        selectedAllergens.push(allergen);
        displaySelectedAllergens();
    }
}

// Function to display selected allergens
function displaySelectedAllergens() {
    const allergenList = document.getElementById("selected-allergens");
    allergenList.innerHTML = ""; // Clear the list

    selectedAllergens.forEach(allergen => {
        const listItem = document.createElement("li");
        listItem.textContent = allergen;
        allergenList.appendChild(listItem);
    });
}

// Event listener for preset buttons
document.querySelectorAll('.allergen-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const allergen = e.target.textContent.replace("＋", "").trim();
        addAllergen(allergen);
    });
});

// Event listener for custom allergen input
document.getElementById("add-custom").addEventListener('click', () => {
    const customAllergen = document.getElementById("custom-allergen").value.trim();
    if (customAllergen) {
        addAllergen(customAllergen);
        document.getElementById("custom-allergen").value = ""; // Clear input field
    }
});

// Store button functionality
document.getElementById("store-allergens").addEventListener('click', () => {
    if (selectedAllergens.length > 0) {
        chrome.storage.local.set({ allergens: selectedAllergens }, () => {
            alert('Allergens stored successfully!');
        });
    } else {
        alert('No allergens selected to store.');
    }
});
// Ensure script runs only after DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Initialize an empty array to store selected allergens
    let selectedAllergens = [];

    // Function to add an allergen
    function addAllergen(allergen) {
        if (!selectedAllergens.includes(allergen)) {
            selectedAllergens.push(allergen);
            displaySelectedAllergens();
        }
    }

    // Function to display selected allergens
    function displaySelectedAllergens() {
        const allergenList = document.getElementById("selected-allergens");
        allergenList.innerHTML = ""; // Clear the list

        selectedAllergens.forEach(allergen => {
            const listItem = document.createElement("li");
            listItem.textContent = allergen;
            allergenList.appendChild(listItem);
        });
    }

    // Event listener for preset buttons
    document.querySelectorAll('.allergen-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const allergen = e.target.textContent.replace("＋", "").trim();
            addAllergen(allergen);
        });
    });

    // Event listener for custom allergen input
    document.getElementById("add-custom").addEventListener('click', () => {
        const customAllergen = document.getElementById("custom-allergen").value.trim();
        if (customAllergen) {
            addAllergen(customAllergen);
            document.getElementById("custom-allergen").value = ""; // Clear input field
        }
    });

    // Store button functionality
    document.getElementById("store-allergens").addEventListener('click', () => {
        if (selectedAllergens.length > 0) {
            chrome.storage.local.set({ allergens: selectedAllergens }, () => {
                alert('Allergens stored successfully!');
            });
        } else {
            alert('No allergens selected to store.');
        }
    });
});
