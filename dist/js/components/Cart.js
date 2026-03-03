import { settings, select, classNames, templates } from "../settings.js";
import utils from "../utils.js";
import CartProduct from "./CartProduct.js";

class Cart {
    constructor(element) {
        const thisCart = this;

        thisCart.products = [];
        thisCart.getElements(element);
        thisCart.initActions();
    }

    getElements(element) {
        const thisCart = this;

        thisCart.dom = {};
        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
        thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
        thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
        thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
        thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
        thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
        thisCart.dom.cartIcon = thisCart.dom.wrapper.querySelector('.cart__icon');
    }

    initActions() {
        const thisCart = this;

        thisCart.dom.toggleTrigger.addEventListener('click', function () {
            thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        });
        
        thisCart.dom.productList.addEventListener('updated', function () {
            thisCart.update();
        });
        
        thisCart.dom.productList.addEventListener('remove', function (event) {
            thisCart.remove(event.detail.cartProduct);
        });
        
        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisCart.sendOrder();
        });
    }

    add(menuProduct) {
        const thisCart = this;

        // Generate HTML for the cart product
        const generatedHTML = templates.cartProduct(menuProduct);
        const generatedDOM = utils.createDOMFromHTML(generatedHTML);
        
        // Add with animation
        generatedDOM.style.opacity = '0';
        generatedDOM.style.transform = 'translateX(50px)';
        this.dom.productList.appendChild(generatedDOM);
        
        // Trigger animation
        setTimeout(() => {
            generatedDOM.style.opacity = '1';
            generatedDOM.style.transform = 'translateX(0)';
        }, 10);

        // Create cart product instance
        const cartProduct = new CartProduct(menuProduct, generatedDOM);
        thisCart.products.push(cartProduct);
        
        // Update and animate
        thisCart.update();
        
        // Animate cart icon
        thisCart.animateCartIcon();
        
        // Show toast notification
        if (window.toast) {
            window.toast.success(`${menuProduct.name} added to cart!`);
        }
    }

    remove(cartProduct) {
        const thisCart = this;

        const index = thisCart.products.indexOf(cartProduct);
        if (index !== -1) {
            // Animate removal
            cartProduct.dom.wrapper.classList.add('removing');
            
            setTimeout(() => {
                cartProduct.dom.wrapper.remove();
                thisCart.products.splice(index, 1);
                thisCart.update();
                
                // Show toast notification
                if (window.toast) {
                    window.toast.info('Item removed from cart');
                }
            }, 300);
        }
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

        thisCart.totalNumber = totalNumber;
        thisCart.subtotalPrice = subtotalPrice;
        thisCart.totalPrice = subtotalPrice + (totalNumber > 0 ? deliveryFee : 0);

        // Animate totals if they changed
        if (thisCart.dom.totalNumber.innerHTML != totalNumber) {
            thisCart.animateElement(thisCart.dom.totalNumber);
        }
        
        if (thisCart.dom.totalPrice.innerHTML != thisCart.totalPrice) {
            thisCart.animateElement(thisCart.dom.totalPrice.querySelector('strong'));
        }

        // Update the HTML
        thisCart.dom.totalNumber.innerHTML = totalNumber;
        thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
        thisCart.dom.deliveryFee.innerHTML = totalNumber > 0 ? deliveryFee : 0;
        thisCart.dom.totalPrice.innerHTML = `Total price: $<strong>${thisCart.totalPrice}</strong>`;

        // Add visual effect
        thisCart.dom.wrapper.classList.add('fade-effect');
        setTimeout(() => {
            thisCart.dom.wrapper.classList.remove('fade-effect');
        }, 500);
    }

    animateCartIcon() {
        const thisCart = this;
        thisCart.dom.cartIcon.classList.add('bounce');
        setTimeout(() => {
            thisCart.dom.cartIcon.classList.remove('bounce');
        }, 500);
    }

    animateElement(element) {
        if (element) {
            element.classList.add('updated');
            setTimeout(() => {
                element.classList.remove('updated');
            }, 500);
        }
    }

    async sendOrder() {
        const thisCart = this;

        // Show loading state on button
        const submitButton = thisCart.dom.form.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');

        const phone = thisCart.dom.wrapper.querySelector(select.cart.phone).value;
        const address = thisCart.dom.wrapper.querySelector(select.cart.address).value;

        if (!phone || phone.length < 10) {
            submitButton.classList.remove('loading');
            window.toast?.error('Please enter a valid phone number');
            return;
        }
        
        if (!address || address.length < 5) {
            submitButton.classList.remove('loading');
            window.toast?.error('Please enter a valid address');
            return;
        }
        
        if (thisCart.products.length === 0) {
            submitButton.classList.remove('loading');
            window.toast?.error('Your cart is empty!');
            return;
        }

        const orderData = {
            phone,
            address,
            total_price: thisCart.totalPrice,
            subtotal_price: thisCart.subtotalPrice,
            delivery_fee: settings.cart.defaultDeliveryFee,
            total_number: thisCart.totalNumber,
            products: thisCart.products.map(p => p.getData())
        };

        try {
            const { data, error } = await window.supabase
                .from('orders')
                .insert([orderData]);
            
            if (error) throw error;

            // Success animations
            window.toast?.success('Order placed successfully!');
            thisCart.animateCartIcon();
            
            // Clear cart with animation
            setTimeout(() => {
                thisCart.clearCart();
            }, 500);
            
        } catch (error) {
            console.error('Error saving order:', error);
            window.toast?.error('Order failed. Please try again.');
        } finally {
            submitButton.classList.remove('loading');
        }
    }

    clearCart() {
        const thisCart = this;

        // Animate removing all items
        const items = [...thisCart.dom.productList.children];
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('removing');
            }, index * 50);
        });

        setTimeout(() => {
            thisCart.products = [];
            thisCart.dom.productList.innerHTML = '';
            thisCart.update();
        }, 300);
    }
}

export default Cart;