chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveAllergens") {
        chrome.storage.local.set({ allergens: message.data }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.action === "viewAllergens") {
        chrome.storage.local.get("allergens", (result) => {
            console.log("Stored Allergens:", result.allergens || []);
            sendResponse({ allergens: result.allergens || [] });
        });
        return true;
    }

    if (message.action === "resetAllergens") {
        chrome.storage.local.remove("allergens", () => {
            sendResponse({ success: true });
        });
        return true;
    }

    // Handling Allergen Alternatives Load
    if (message.type === "loadAllergenData") {
        fetch(chrome.runtime.getURL("allergen_alternatives.json"))
            .then(response => response.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // Handling Cross-Reactive Allergens Load
    if (message.type === "loadCrossReactiveData") {
        fetch(chrome.runtime.getURL("cross_reactive_allergens.json"))
            .then(response => response.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
    