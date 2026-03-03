/* global supabase */

import { supabaseConfig } from './config.js';

// Import Toast
import './components/Toast.js';

// Rest of your app.js code...

const { createClient } = supabase;

const supabaseUrl = supabaseConfig.url;
const supabaseAnonKey = supabaseConfig.anonKey;

window.supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client initialized from CDN');

import { select, classNames } from "./settings.js";
import Product from "./components/Product.js";
import Cart from "./components/Cart.js";
import Booking from "./components/Booking.js";
import Home from "./components/Home.js";


const app = {
  initPages() {
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();
        // get page id from href attribute
        const id = clickedElement.getAttribute('href').replace('#', '');

        // run thisApp.activatePage with that id
        thisApp.activatePage(id);

        // change URL hash
        window.location.hash = '#/' + id;
      });
    }
  },
  
  // Add active class to matching pages or remove it
  activatePage: function (pageId) {
    const thisApp = this;
    // Add active class to matching links or remove it
    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    for (let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },

  initMenu: function () {
    const thisApp = this;

    // Loop through each product in the data
    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]); // Create a new Product instance
    }
  },

  // FIXED: Changed from async function to method with async keyword
  initData: async function() {
    const thisApp = this;
    
    try {
      // Fetch products from Supabase
      const { data: products, error } = await window.supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      
      // Transform data to match your app's expected format
      thisApp.data = {
        products: {}
      };
      
      products.forEach(product => {
        thisApp.data.products[product.id] = product;
      });
      
      thisApp.initMenu();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  },

  initCart: function () {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart); // Get the cart element
    thisApp.cart = new Cart(cartElem); // Create a new Cart instance

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product);
    });
  },

  initBooking() {
    const bookingContainer = document.querySelector(select.containerOf.booking);
    
    if (bookingContainer) {
      new Booking(bookingContainer);
    } else {
      console.error('Booking container not found');
    }
  },

  initHome() {
    const homeContainer = document.querySelector(select.containerOf.home);
    new Home(homeContainer);
  },

  init: function () {
    const thisApp = this;
    thisApp.initData(); // Initialize data
    thisApp.initCart(); // Initialize cart
    thisApp.initHome();
    thisApp.initBooking();
    thisApp.initPages(); // Initialize pages
  },
};

// Start the application
document.addEventListener('DOMContentLoaded', function () {
  app.init();
});