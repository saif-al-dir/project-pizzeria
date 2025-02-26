/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars
{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: "#template-menu-product",
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
      cart: {
        productList: '.cart__order-summary',
        toggleTrigger: '.cart__summary',
        totalNumber: `.cart__total-number`,
        totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
        subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
        deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
        toTal: '.cart__order-total .cart__order-price-sum strong', 
        form: '.cart__order',
        formSubmit: '.cart__order [type="submit"]',
        phone: '[name="phone"]',
        address: '[name="address"]',
      },
      cartProduct: {
        amountWidget: '.widget-amount',
        price: '.cart__product-price',
        edit: '[href="#edit"]',
        remove: '[href="#remove"]',
      },
      // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1, // Default quantity
      defaultMin: 1,   // Minimum quantity
      defaultMax: 9,  // Maximum quantity
    },
    // CODE ADDED START
      cart: {
        defaultDeliveryFee: 20,
      },
      // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
        wrapperActive: 'active',
      },
      // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
  
      thisWidget.element = element; // Store the reference to the widget element
      thisWidget.getElements(); // Get references to the input and buttons
      thisWidget.value = settings.amountWidget.defaultValue; // Set the default value
      thisWidget.setValue(thisWidget.input.value); // Initialize the value based on the input
      thisWidget.initActions(); // Set up event listeners
    }
  
    getElements() {
      const thisWidget = this;

      // Get references to the input and buttons
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
  
    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value); // Convert the input value to an integer
  
      // Validate the new value
      if (newValue !== thisWidget.value && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        thisWidget.value = newValue; // Update the value
        thisWidget.input.value = thisWidget.value; // Update the input field
        thisWidget.announce(); // Notify that the value has changed
      } else {
        thisWidget.input.value = thisWidget.value; // Restore the previous value if invalid
      }
    }
  
    initActions() {
      const thisWidget = this;
  
      // Set up event listeners for input and buttons
      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });
  
      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default action
        thisWidget.setValue(thisWidget.value - 1); // Decrease the value
      });
  
      thisWidget.linkIncrease.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default action
        thisWidget.setValue(thisWidget.value + 1); // Increase the value
      });
    }
  
    announce() {
      const thisWidget = this;
      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

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

    addToCart() {
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct()); // Pass the prepared product summary to the cart
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
      clickableTrigger.addEventListener('click', function(event) {
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

      thisProduct.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart(); // Add product to cart after processing order
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function() {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart(); // Add product to cart on button click
      });
    }


    initAmountWidget() {
      const thisProduct = this;
    
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem); // Create an instance of AmountWidget
      thisProduct.amountWidget.product = thisProduct; // Pass the Product instance
      
        // Add event listener for amount widget update
      thisProduct.amountWidgetElem.addEventListener('updated', function() {
      thisProduct.processOrder(); // Call processOrder to update the price
      });
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
          console.log(`Checking option: ${optionId}, isSelected: ${isSelected}`);

          // If the option is selected and is not default, increase the price
          if (isSelected && !option.default) {
            price += option.price;
            console.log(`Added ${option.price} for option: ${optionId}. New price: ${price}`);
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
    console.log('this is the line', price);
      // Update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
      console.log(`Final price for product ${thisProduct.id}: ${price}`);
    }
  }


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
      thisCart.dom.toTal = thisCart.dom.wrapper.querySelector(select.cart.toTal);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
    }
  
    initActions() {
      const thisCart = this;
  
      // Add click event listener to the toggle trigger
        thisCart.dom.toggleTrigger.addEventListener('click', function() {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive); // Toggle the active class
      });
      thisCart.dom.productList.addEventListener('updated', function() {
        thisCart.update();
      });
      // Add event listener for the remove event
      thisCart.dom.productList.addEventListener('remove', function(event) {
        thisCart.remove(event.detail.cartProduct); // Call the remove method with the cart product
    });
    }

    add(menuProduct) {
      const thisCart = this;

      console.log('adding product', menuProduct);
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

    update(){
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

      
    }
  } 

  class CartProduct {
    constructor (menuProduct, element) {
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

        console.log('new CartProduct:', thisCartProduct);
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

    initAmountWidget() {
      const thisCartProduct = this;
  
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.amountWidget.product = thisCartProduct;
  
      // Add event listener for amount widget update
        thisCartProduct.dom.amountWidget.addEventListener('updated', function() {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price; // Update price in HTML
      });
    }

    initActions() {
      const thisCartProduct = this;
  
      // Add event listener for the remove button
      thisCartProduct.dom.remove.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default action
        thisCartProduct.remove(); // Call the remove method
      });
  
      // Add event listener for the edit button (currently does nothing)
      thisCartProduct.dom.edit.addEventListener('click', function(event) {
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

  const app = {
    initMenu: function() {
      const thisApp = this;

      console.log('thisApp.data:', thisApp.data); // Log the data

      // Loop through each product in the data
      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]); // Create a new Product instance
      }
    },

    initData: function() {
      const thisApp = this;
      thisApp.data = dataSource; // Reference to the data source
    },

    initCart: function() {
      const thisApp = this;
  
      const cartElem = document.querySelector(select.containerOf.cart); // Get the cart element
      thisApp.cart = new Cart(cartElem); // Create a new Cart instance
    },

    init: function() {
      const thisApp = this;
      console.log(' *** App starting **** ');
      thisApp.initData(); // Initialize data
      thisApp.initMenu(); // Initialize menu
      thisApp.initCart(); // Initialize cart
    },
  };

  // Start the application
  app.init();
}