import { select } from "./settings.js";
import AmountWidget from "./AmountWidget";

class CartProduct {
    constructor(menuProduct, element) {
        const thisCartProduct = this;

        // Save product summary properties
        thisCartProduct.id = menuProduct.id;
        thisCartProduct.name = menuProduct.name;
        thisCartProduct.amount = menuProduct.amount;
        thisCartProduct.priceSingle = menuProduct.priceSingle;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount; // Calculate initial price
        thisCartProduct.params = menuProduct.params;

        // Get DOM elements
        thisCartProduct.getElements(element);

        // Initialize amount widget
        thisCartProduct.initAmountWidget();

        // Initialize actions
        thisCartProduct.initActions();
    }

    getElements(element) {
        const thisCartProduct = this;

        thisCartProduct.dom = {};
        thisCartProduct.dom.wrapper = element;
        thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
        thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
        thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
        thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    getData() {
        return {
            id: this.id,
            amount: this.amount,
            price: this.price,
            priceSingle: this.priceSingle,
            name: this.name,
            params: this.params,
        };
    }

    initAmountWidget() {
        const thisCartProduct = this;

        thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
        thisCartProduct.amountWidget.product = thisCartProduct;

        // Add event listener for amount widget update
        thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
            thisCartProduct.amount = thisCartProduct.amountWidget.value;
            thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
            thisCartProduct.dom.price.innerHTML = thisCartProduct.price; // Update price in HTML
        });
    }

    initActions() {
        const thisCartProduct = this;

        // Add event listener for the remove button
        thisCartProduct.dom.remove.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default action
            thisCartProduct.remove(); // Call the remove method
        });

        // Add event listener for the edit button (currently does nothing)
        thisCartProduct.dom.edit.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default action
            // Future edit functionality can be added here
        });
    }

    remove() {
        const thisCartProduct = this;

        const event = new CustomEvent('remove', {
            bubbles: true,
            detail: {
                cartProduct: thisCartProduct,
            },
        });

        thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
}

export default CartProduct;
