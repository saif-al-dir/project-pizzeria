import { settings, select } from "./settings.js";
import Product from "./components/Product.js";
import Cart from "./components/Cart.js";


const app = {
  initMenu: function () {
    const thisApp = this;

    // Loop through each product in the data
    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]); // Create a new Product instance
    }
  },

  initData: function () {
    const thisApp = this;
    thisApp.data = {}; // Zastąpienie dataSource pustym obiektem

    const url = settings.db.url + '/' + settings.db.products; // Adres endpointu

    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json(); // Konwersja odpowiedzi na JSON
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);

        // Zapisz parsedResponse jako thisApp.data.products
        thisApp.data.products = parsedResponse;

        // Wywołaj metodę initMenu
        thisApp.initMenu();

        console.log('thisApp.data', JSON.stringify(thisApp.data));
      });
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

  init: function () {
    const thisApp = this;
    console.log(' *** App starting **** ');
    thisApp.initData(); // Initialize data
    thisApp.initCart(); // Initialize cart
  },
};

// Start the application
app.init();
