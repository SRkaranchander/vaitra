document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("saveButton").addEventListener("click", storeAllergen);
    document.getElementById("resetButton").addEventListener("click", resetAllergens);
    document.getElementById("websiteButton").addEventListener("click", visitWebsite);
    loadAllergens();
});

// ✅ Store Allergen
function storeAllergen() {
    const allergen = document.getElementById("allergenInput").value.trim();
    if (allergen) {
        chrome.storage.local.get("allergens", (result) => {
            const allergens = result.allergens || [];
            if (!allergens.includes(allergen)) {
                allergens.push(allergen);
                chrome.storage.local.set({ allergens }, () => {
                    document.getElementById("statusMessage").innerText = "Allergen saved!";
                    loadAllergens();
                    document.getElementById("allergenInput").value = "";
                });
            } else {
                document.getElementById("statusMessage").innerText = "Allergen already exists!";
            }
        });
    } else {
        document.getElementById("statusMessage").innerText = "Please enter an allergen.";
    }
}

// ✅ Load Allergens
function loadAllergens() {
    chrome.storage.local.get("allergens", (result) => {
        const allergens = result.allergens || [];
        document.getElementById("statusMessage").innerText = allergens.length > 0 
            ? "Stored Allergens: " + allergens.join(", ")
            : "No allergens found.";
    });
}

// ✅ Reset Allergens
function resetAllergens() {
    chrome.storage.local.remove("allergens", () => {
        document.getElementById("statusMessage").innerText = "Allergens cleared.";
        loadAllergens();
    });
}

function visitWebsite() {
    chrome.tabs.create({ url: "https://vaitra.netlify.app/" });
}