import { settings, select, classNames, templates } from "../settings.js";
import utils from "../utils.js";
import CartProduct from "./CartProduct.js";

class Cart {
    constructor(element) {
        const thisCart = this;

        thisCart.products = []; // Initialize an empty array for products
        thisCart.getElements(element); // Get DOM elements
        thisCart.initActions(); // Initialize actions
    }

    getElements(element) {
        const thisCart = this;

        thisCart.dom = {}; // Create an object to hold DOM elements
        thisCart.dom.wrapper = element; // Reference to the cart wrapper
        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger); // Reference to the toggle trigger
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList); // Reference to the product list
        thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
        thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
        thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
        thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
        thisCart.dom.toTal = thisCart.dom.wrapper.querySelector(select.cart.toTal);

        thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form); // Reference to the order form
    }

    initActions() {
        const thisCart = this;

        // Add click event listener to the toggle trigger
        thisCart.dom.toggleTrigger.addEventListener('click', function () {
            thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive); // Toggle the active class
        });
        thisCart.dom.productList.addEventListener('updated', function () {
            thisCart.update();
        });
        // Add event listener for the remove event
        thisCart.dom.productList.addEventListener('remove', function (event) {
            thisCart.remove(event.detail.cartProduct); // Call the remove method with the cart product
        });
        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default form submission
            thisCart.sendOrder(); // Call sendOrder method
        });
    }

    clearCart() {
        const thisCart = this;

        // Clear the products array
        thisCart.products = [];

        // Clear the product list in the DOM
        thisCart.dom.productList.innerHTML = ''; // Remove all cart products from the DOM

        // Reset totals
        thisCart.update(); // Update the cart totals to reflect the cleared cart
    }

    sendOrder() {
        const thisCart = this;

        const url = settings.db.url + '/' + settings.db.orders; // Endpoint for orders
        const phone = thisCart.dom.wrapper.querySelector(select.cart.phone).value;
        const address = thisCart.dom.wrapper.querySelector(select.cart.address).value;

        // Basic validation
        if (!phone || phone.length < 10) {
            alert('Please enter a valid phone number.');
            return;
        }
        if (!address || address.length < 5) {
            alert('Please enter a valid address.');
            return;
        }
        if (thisCart.products.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Prepare the payload
        const payload = {
            address: thisCart.dom.wrapper.querySelector(select.cart.address).value,
            phone: thisCart.dom.wrapper.querySelector(select.cart.phone).value,
            totalPrice: thisCart.totalPrice,
            subtotalPrice: thisCart.totalPrice - settings.cart.defaultDeliveryFee,
            totalNumber: thisCart.totalNumber,
            deliveryFee: settings.cart.defaultDeliveryFee,
            toTal: thisCart.toTal,
            products: [] // This will be filled later
        };

        // Fill the products array
        for (let prod of thisCart.products) {
            payload.products.push(prod.getData());
        }

        console.log('payload', payload); // Log the payload for debugging

        // Send the order to the server
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        fetch(url, options)
            .then(function (response) {
                return response.json();
            })
            .then(function (parsedResponse) {
                console.log('parsedResponse', parsedResponse); // Log the response from the server
                thisCart.clearCart(); // Clear the cart after successful order
            });
        console.log(this.sendOrder);
    }

    add(menuProduct) {
        const thisCart = this;

        // Generate HTML for the cart product
        const generatedHTML = templates.cartProduct(menuProduct);
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        this.dom.productList.appendChild(generatedDOM); // Add the product to the cart

        // Create a new CartProduct instance and add it to the products array
        const cartProduct = new CartProduct(menuProduct, generatedDOM);
        thisCart.products.push(cartProduct); // Add the CartProduct instance to the products array
        // Update cart totals
        this.update();
    }

    update() {
        const thisCart = this;

        const deliveryFee = settings.cart.defaultDeliveryFee;
        let totalNumber = 0;
        let subtotalPrice = 0;

        for (let product of thisCart.products) {
            totalNumber += product.amount;
            subtotalPrice += product.price;
        }

        thisCart.totalPrice = subtotalPrice + (totalNumber > 0 ? deliveryFee : 0);

        // Update the HTML
        thisCart.dom.totalNumber.innerHTML = totalNumber;
        thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
        thisCart.dom.deliveryFee.innerHTML = totalNumber > 0 ? deliveryFee : 0;
        thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
        thisCart.dom.toTal.innerHTML = thisCart.dom.totalPrice.innerHTML;

        // Add visual effect to the cart or product list
        thisCart.dom.wrapper.classList.add('fade-effect'); // If you want to apply to the entire cart
        // or
        thisCart.dom.productList.classList.add('fade-effect'); // If you want to apply to the product list

        setTimeout(() => {
            thisCart.dom.wrapper.classList.remove('fade-effect'); // Remove after 1 second
            // or
            thisCart.dom.productList.classList.remove('fade-effect'); // Remove after 1 second
        }, 1000);
    }

    remove(cartProduct) {
        const thisCart = this;

        // Find the index of the product to remove
        const index = thisCart.products.indexOf(cartProduct);
        if (index !== -1) {
            // Remove the product from the DOM
            cartProduct.dom.wrapper.remove();
            // Remove the product from the products array
            thisCart.products.splice(index, 1);
            // Update the cart totals
            thisCart.update();
        }
    }
}

export default Cart;
