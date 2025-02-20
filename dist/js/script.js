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
      thisProduct.initAccordion(); // Initialize the accordion functionality

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

    initAccordion() {
      const thisProduct = this;

      // Find the clickable trigger (the product header)
      const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

      // Add event listener to clickable trigger on event click
      clickableTrigger.addEventListener('click', function(event) {
        // Prevent default action for event
        event.preventDefault();

        // Find active product (product that has active class)
        const activeProduct = document.querySelector(select.menuProduct.wrapperActive);

        // If there is an active product and it's not thisProduct.element, remove class active from it
        if (activeProduct && activeProduct !== thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }

        // Toggle active class on thisProduct.element
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
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