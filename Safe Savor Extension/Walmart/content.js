(async function () {
    try {
        console.log("🚀 Safe Savor Extension Started");
        
        async function loadAllergenAlternatives() {
            try {
                return new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: "loadAllergenData" }, (response) => {
                        if (response && response.success) {
                            console.log("✅ Allergen alternatives loaded successfully:", response.data);
                            resolve(response.data);
                        } else {
                            console.error("❌ Failed to load allergen alternatives:", response?.error);
                            resolve({});
                        }
                    });
                });
            } catch (error) {
                console.error("❌ Error loading allergen alternatives:", error);
                return {};
            }
        }
        async function loadCrossReactiveData() {
            try {
                return new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: "loadCrossReactiveData" }, (response) => {
                        if (response && response.success) {
                            console.log("✅ Cross-reactive data loaded successfully:", response.data);
                            resolve(response.data);
                        } else {
                            console.error("❌ Failed to load cross-reactive allergens:", response?.error);
                            resolve({});
                        }
                    });
                });
            } catch (error) {
                console.error("❌ Error loading cross-reactive allergens:", error);
                return {};
            }
        }
        async function extractIngredients() {
            try {
                console.log("🔍 Starting ingredient extraction...");
                
                // Multiple strategies to find ingredients
                const selectors = [
                    'div[data-testid="ui-collapse-panel"]',
                    '[data-testid="ingredients-section"]',
                    '.ingredients-section',
                    '.product-ingredients',
                    '[aria-label*="ingredients" i]',
                    '[aria-label*="nutrition" i]',
                    'div:has(h3:contains("Ingredients"))',
                    'div:has(span:contains("Ingredients"))',
                    'section:has(*:contains("Ingredients"))'
                ];
                let ingredientsText = '';
                let foundSection = null;
                // Try each selector
                for (const selector of selectors) {
                    try {
                        const sections = document.querySelectorAll(selector);
                        console.log(`🔍 Trying selector: ${selector}, found ${sections.length} elements`);
                        
                        for (const section of sections) {
                            const sectionText = section.textContent.toLowerCase();
                            console.log(`📝 Section text preview: ${sectionText.substring(0, 100)}...`);
                            
                            if (sectionText.includes('ingredient')) {
                                foundSection = section;
                                ingredientsText = section.textContent.trim();
                                console.log(`✅ Found ingredients section with selector: ${selector}`);
                                break;
                            }
                        }
                        
                        if (foundSection) break;
                    } catch (e) {
                        console.log(`⚠️ Selector failed: ${selector}`, e.message);
                    }
                }
                // Fallback: Search entire page for ingredients
                if (!ingredientsText) {
                    console.log("🔍 No specific section found, searching entire page...");
                    const allText = document.body.textContent.toLowerCase();
                    const ingredientIndex = allText.indexOf('ingredient');
                    
                    if (ingredientIndex !== -1) {
                        // Extract surrounding text
                        const start = Math.max(0, ingredientIndex - 50);
                        const end = Math.min(allText.length, ingredientIndex + 500);
                        ingredientsText = allText.substring(start, end);
                        console.log("✅ Found ingredients in page text");
                    }
                }
                console.log("🚀 Final Ingredients Text:", ingredientsText);
                console.log("📏 Ingredients text length:", ingredientsText.length);
                if (ingredientsText && ingredientsText.length > 10) {
                    const allergenAlternatives = await loadAllergenAlternatives();
                    const crossReactiveData = await loadCrossReactiveData();
                    
                    // Force test with milk if no specific allergens
                    console.log("🧪 Testing with milk allergen for debugging...");
                    compareWithStoredAllergens(ingredientsText, allergenAlternatives, crossReactiveData, true);
                } else {
                    console.log("❌ No ingredients found or text too short");
                    // Show debug alert
                    alert("🔍 Safe Savor Debug: No ingredients found on this page. This might not be a product page or ingredients section is not loaded yet.");
                }
            } catch (error) {
                console.error("❌ Error in extracting ingredients:", error);
                alert(`🔍 Safe Savor Debug Error: ${error.message}`);
            }
        }
        function compareWithStoredAllergens(ingredientsText, allergenAlternatives, crossReactiveData, debugMode = false) {
            try {
                console.log("🔍 Running compareWithStoredAllergens...");
                console.log("🧪 Debug mode:", debugMode);
                const normalizedIngredients = ingredientsText.toLowerCase();
                console.log("📝 Normalized ingredients preview:", normalizedIngredients.substring(0, 200));
                chrome.storage.local.get("allergens", (result) => {
                    console.log("💾 Allergens from Storage:", result.allergens);
                    let allergens = result.allergens || [];
                    
                    // For debugging, add milk if no allergens stored
                    if (debugMode && allergens.length === 0) {
                        allergens = ['milk'];
                        console.log("🧪 Debug: Using 'milk' as test allergen");
                    }
                    const matchedAllergens = [];
                    const matchedDerivatives = [];
                    const matchedCrossReactives = [];
                    allergens.forEach(allergen => {
                        console.log(`🔍 Checking allergen: "${allergen}"`);
                        const normalizedAllergen = allergen.toLowerCase();
                        
                        // Create multiple regex patterns for better matching
                        const patterns = [
                            new RegExp(`\\b${normalizedAllergen}\\b`, "i"),
                            new RegExp(`${normalizedAllergen}`, "i"),
                            new RegExp(`\\b${normalizedAllergen}s\\b`, "i"), // plural
                            new RegExp(`\\b${normalizedAllergen}ed\\b`, "i") // past tense
                        ];
                        let found = false;
                        patterns.forEach((regex, index) => {
                            if (regex.test(normalizedIngredients)) {
                                console.log(`✅ Match found with pattern ${index + 1}: ${regex}`);
                                if (!found) {
                                    matchedAllergens.push(allergen);
                                    found = true;
                                }
                            }
                        });
                        if (!found) {
                            console.log(`❌ No direct match for "${allergen}"`);
                            // Check derivatives
                            const alternatives = allergenAlternatives[allergen] || [];
                            console.log(`🔍 Checking ${alternatives.length} alternatives for ${allergen}:`, alternatives);
                            
                            alternatives.forEach(alt => {
                                const normalizedAlt = alt.toLowerCase();
                                const altRegex = new RegExp(`\\b${normalizedAlt}\\b`, "i");
                                if (altRegex.test(normalizedIngredients)) {
                                    console.log(`✅ Derivative match: ${alt}`);
                                    matchedDerivatives.push(`${alt} (derived from ${allergen})`);
                                } else {
                                    console.log(`❌ No match for derivative: ${alt}`);
                                }
                            });
                        }
                    });
                    console.log("✅ Final Results:");
                    console.log("   Matched Allergens:", matchedAllergens);
                    console.log("   Matched Derivatives:", matchedDerivatives);
                    console.log("   Matched Cross Reactives:", matchedCrossReactives);
                    // Always show alert in debug mode, even if no matches
                    if (matchedAllergens.length > 0 || matchedDerivatives.length > 0 || matchedCrossReactives.length > 0) {
                        generateAlert(matchedAllergens, matchedDerivatives, matchedCrossReactives);
                    } else if (debugMode) {
                        alert(`🔍 Safe Savor Debug: No allergen matches found.\n\nIngredients found: ${ingredientsText.length > 0 ? 'Yes' : 'No'}\nAllergens stored: ${allergens.join(', ') || 'None'}\n\nIngredients preview: ${normalizedIngredients.substring(0, 200)}...`);
                    }
                });
            } catch (error) {
                console.error("❌ Error in comparing with stored allergens:", error);
                alert(`🔍 Safe Savor Debug Error in comparison: ${error.message}`);
            }
        }
        function generateAlert(matchedAllergens, matchedDerivatives, matchedCrossReactives) {
            try {
                console.log("🚨 Generating alert...");
                let alertMessage = "⚠️ Safe Savor Alert\n\n";
                if (matchedAllergens.length > 0) {
                    alertMessage += `This product contains your allergen(s): ${matchedAllergens.join(", ")}.\n`;
                }
                if (matchedDerivatives.length > 0) {
                    alertMessage += `This product includes derivatives: ${matchedDerivatives.join(", ")}.\n`;
                }
                if (matchedCrossReactives.length > 0) {
                    alertMessage += `This product contains ingredients that may cause cross-reactive reactions:\n`;
                    matchedCrossReactives.forEach((cross) => {
                        alertMessage += `- ${cross}\n`;
                    });
                }
                alertMessage += "\n⚠️ Proceed only if you are sure it is safe for you.";
                
                console.log("🚨 Alert message:", alertMessage);
                alert(alertMessage);
            } catch (error) {
                console.error("❌ Error in generating alert:", error);
            }
        }
        function observeAddToCart() {
            try {
                console.log("👀 Starting to observe Add to Cart buttons...");
                
                const buttonSelectors = [
                    'button[data-automation-id="atc"]',
                    '[data-testid="add-to-cart"]',
                    'button:contains("Add to cart")',
                    'button[aria-label*="Add to cart" i]',
                    '.add-to-cart-button',
                    '[data-automation-id*="add-to-cart"]'
                ];
                function attachListeners() {
                    buttonSelectors.forEach(selector => {
                        const buttons = document.querySelectorAll(selector);
                        console.log(`🔍 Found ${buttons.length} buttons with selector: ${selector}`);
                        
                        buttons.forEach(button => {
                            if (!button.dataset.safeSavorAttached) {
                                button.dataset.safeSavorAttached = "true";
                                button.addEventListener('click', (e) => {
                                    console.log("🛒 Add to cart button clicked!");
                                    console.log("🛒 Button element:", button);
                                    setTimeout(() => {
                                        extractIngredients();
                                    }, 1000); // Wait a bit for any content to load
                                });
                                console.log("✅ Listener attached to button");
                            }
                        });
                    });
                }
                // Initial attachment
                attachListeners();
                // Observe for dynamic content
                const observer = new MutationObserver((mutations) => {
                    let shouldReattach = false;
                    mutations.forEach(mutation => {
                        if (mutation.addedNodes.length > 0) {
                            shouldReattach = true;
                        }
                    });
                    
                    if (shouldReattach) {
                        console.log("🔄 DOM changed, reattaching listeners...");
                        attachListeners();
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                console.log("✅ Observer set up successfully");
            } catch (error) {
                console.error("❌ Error in observing add-to-cart button:", error);
            }
        }
        function runSafeSavor() {
            try {
                console.log("🚀 Running Safe Savor...");
                observeAddToCart();
                
                // Also add a manual test button for debugging
                setTimeout(() => {
                    console.log("🧪 Adding debug test button...");
                    const debugButton = document.createElement('button');
                    debugButton.innerText = '🧪 Test Safe Savor';
                    debugButton.style.position = 'fixed';
                    debugButton.style.top = '10px';
                    debugButton.style.right = '10px';
                    debugButton.style.zIndex = '9999';
                    debugButton.style.backgroundColor = '#d06a6aff';
                    debugButton.style.color = 'white';
                    debugButton.style.border = 'none';
                    debugButton.style.padding = '10px';
                    debugButton.style.borderRadius = '5px';
                    debugButton.style.cursor = 'pointer';
                    
                    debugButton.addEventListener('click', () => {
                        console.log("🧪 Manual test triggered");
                        extractIngredients();
                    });
                    
                    document.body.appendChild(debugButton);
                    console.log("✅ Debug button added");
                }, 2000);
                
            } catch (error) {
                console.error("❌ Error in running Safe Savor:", error);
            }
        }
        // Initial run
        runSafeSavor();
        // Handle SPA navigation
        let currentUrl = location.href;
        const originalPushState = history.pushState;
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            if (location.href !== currentUrl) {
                currentUrl = location.href;
                console.log("🔄 URL changed via pushState:", currentUrl);
                setTimeout(runSafeSavor, 1000);
            }
        };
        window.addEventListener('popstate', () => {
            if (location.href !== currentUrl) {
                currentUrl = location.href;
                console.log("🔄 URL changed via popstate:", currentUrl);
                setTimeout(runSafeSavor, 1000);
            }
        });
        console.log("✅ Safe Savor Extension fully initialized");
        
    } catch (error) {
        console.error("❌ Critical error in main function:", error);
        alert(`🔍 Safe Savor Critical Error: ${error.message}`);
    }
})();