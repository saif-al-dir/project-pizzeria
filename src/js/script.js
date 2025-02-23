/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: "#template-menu-product",
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
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id; // Store the product ID
      thisProduct.data = data; // Store the product data

      thisProduct.renderInMenu(); // Call the method to render the product in the menu
      thisProduct.getElements(); // Call the new method to get elements
      thisProduct.initAccordion(); // Initialize the accordion functionality
      thisProduct.initOrderForm(); // Initialize the order form functionality
      thisProduct.processOrder(); // Call the processOrder method to set initial price

      console.log('new Product:', thisProduct); // Log the new product instance
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
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function() {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    processOrder() {
      const thisProduct = this;

      // Convert form to object structure
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData', formData);

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
        }
      }

      // Update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
      console.log(`Final price for product ${thisProduct.id}: ${price}`);
    }
  }

  const app = {
    initData: function() {
      const thisApp = this;
      thisApp.data = dataSource; // Reference to the data source
    },

    initMenu: function() {
      const thisApp = this;

      console.log('thisApp.data:', thisApp.data); // Log the data

      // Loop through each product in the data
      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]); // Create a new Product instance
      }
    },

    init: function() {
      const thisApp = this;
      console.log(' *** App starting **** ');
      thisApp.initData(); // Initialize data
      thisApp.initMenu(); // Initialize menu
    },
  };

  // Start the application
  app.init();
}