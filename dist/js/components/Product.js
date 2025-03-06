import { select, classNames, templates } from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import utils from "../utils.js";

class Product {
    constructor(id, data) {
        const thisProduct = this;

        thisProduct.id = id; // Store the product ID
        thisProduct.data = data; // Store the product data

        thisProduct.renderInMenu(); // Call the method to render the product in the menu
        thisProduct.getElements(); // Call the new method to get elements
        thisProduct.initAccordion(); // Initialize the accordion functionality
        thisProduct.initOrderForm(); // Initialize the order form functionality
        thisProduct.initAmountWidget(); // Add this line to initialize the amount widget
        thisProduct.processOrder(); // Call the processOrder method to set initial price
    }

    renderInMenu() {
        const thisProduct = this;

        // Step 1: Generate HTML based on template
        const generatedHTML = templates.menuProduct(thisProduct.data);

        // Step 2: Create element using utils.createDOMFromHTML
        thisProduct.element = utils.createDOMFromHTML(generatedHTML);

        // Step 3: Find menu container
        const menuContainer = document.querySelector(select.containerOf.menu);

        // Step 4: Add element to menu
        menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
        const thisProduct = this;

        thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
        thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
        thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
        thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
        thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
        thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper); // images wrapper
        thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget); // Add reference to the widget
    }

    initAccordion() {
        const thisProduct = this;

        // Find the clickable trigger (the product header)
        const clickableTrigger = thisProduct.accordionTrigger; // Use the reference from getElements

        // Add event listener to clickable trigger on event click
        clickableTrigger.addEventListener('click', function (event) {
            // Prevent default action for event
            event.preventDefault();

            // Find active product (product that has active class)
            const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

            // Check if this product is already active
            const isActive = thisProduct.element.classList.contains(classNames.menuProduct.wrapperActive);

            // If there is an active product and it's not thisProduct.element, remove class active from it
            for (const activeProduct of activeProducts) {
                activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
            }

            if (!isActive) {
                // Toggle active class on thisProduct.element
                thisProduct.element.classList.add(classNames.menuProduct.wrapperActive);
            }
        });
    }

    initOrderForm() {
        const thisProduct = this;

        thisProduct.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisProduct.processOrder();
            thisProduct.addToCart(); // Add product to cart after processing order
        });

        for (let input of thisProduct.formInputs) {
            input.addEventListener('change', function () {
                thisProduct.processOrder();
            });
        }

        thisProduct.cartButton.addEventListener('click', function (event) {
            event.preventDefault();
            thisProduct.processOrder();
            thisProduct.addToCart(); // Add product to cart on button click
        });
    }

    prepareCartProduct() {
        const thisProduct = this;

        const productSummary = {
            id: thisProduct.id,
            name: thisProduct.data.name,
            amount: thisProduct.amountWidget.value,
            priceSingle: thisProduct.priceSingle, // This will be set in processOrder
            price: thisProduct.priceSingle * thisProduct.amountWidget.value, // Total price
            params: thisProduct.prepareCartProductParams(), // Get selected options
        };

        return productSummary;
    }

    prepareCartProductParams() {
        const thisProduct = this;

        const formData = utils.serializeFormToObject(thisProduct.form);
        const params = {};

        // For every category (param)
        for (let paramId in thisProduct.data.params) {
            const param = thisProduct.data.params[paramId];

            // Create category param in params
            params[paramId] = {
                label: param.label,
                options: {},
            };

            // For every option in this category
            for (let optionId in param.options) {
                const option = param.options[optionId];
                const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

                if (optionSelected) {
                    // Option is selected!
                    params[paramId].options[optionId] = option.label; // Add selected option to params
                }
            }
        }

        return params;
    }

    processOrder() {
        const thisProduct = this;

        // Convert form to object structure
        const formData = utils.serializeFormToObject(thisProduct.form);

        // Set price to default price
        let price = thisProduct.data.price;

        // For every category (param)...
        for (let paramId in thisProduct.data.params) {
            const param = thisProduct.data.params[paramId];

            // For every option in this category
            for (let optionId in param.options) {
                const option = param.options[optionId];

                // Check if the option is selected
                const isSelected = formData[paramId] && formData[paramId].includes(optionId);

                // If the option is selected and is not default, increase the price
                if (isSelected && !option.default) {
                    price += option.price;
                }

                // If the option is not selected but is default, decrease the price
                if (!isSelected && option.default) {
                    price -= option.price;
                    console.log(`Removed ${option.price} for default option: ${optionId}. New price: ${price}`);
                }

                // Handle image visibility
                const image = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
                if (image) {
                    if (isSelected) {
                        image.classList.add(classNames.menuProduct.imageVisible); // show the image
                    } else {
                        image.classList.remove(classNames.menuProduct.imageVisible); // hide the image
                    }
                }
            }
        }

        // Set the priceSingle property
        thisProduct.priceSingle = price; // Set the single price

        // Multiply price by the selected amount
        price *= thisProduct.amountWidget.value;
        // Update calculated price in the HTML
        thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget() {
        const thisProduct = this;

        thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem); // Create an instance of AmountWidget
        thisProduct.amountWidget.product = thisProduct; // Pass the Product instance

        // Add event listener for amount widget update
        thisProduct.amountWidgetElem.addEventListener('updated', function () {
            thisProduct.processOrder(); // Call processOrder to update the price
        });
    }

    addToCart() {
        const thisProduct = this;
        // app.cart.add(thisProduct.prepareCartProduct()); // Pass the prepared product summary to the cart
        const event = new CustomEvent('add-to-cart', {
            bubbles: true,
            detail: {
                product: thisProduct,

            }
        });
        thisProduct.element.dispatchEvent(event);
    }

}

export default Product;
