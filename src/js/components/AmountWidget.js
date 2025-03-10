import { settings, select } from "../settings.js";
import BaseWidget from "./BaseWidget.js";

class AmountWidget extends BaseWidget {
    constructor(element) {
        super(element, settings.amountWidget.defaultValue);
        const thisWidget = this;
        console.log('This Widget:', thisWidget);
        thisWidget.getElements(); // Get references to the input and buttons
        thisWidget.initActions(); // Set up event listeners

        console.log('AmountWidget:', thisWidget);
    }

    getElements() {
        const thisWidget = this;

        // Get references to the input and buttons

        thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
        thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
        thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);


        console.log('Input:', this.dom.input);
        console.log('Link Decrease:', this.dom.linkDecrease);
        console.log('Link Increase:', this.dom.linkIncrease);
    }

    isValid(value) {
        return !isNaN(value)
            && value >= settings.amountWidget.defaultMin
            && value <= settings.amountWidget.defaultMax;
    }

    renderValue() {
        const thisWidget = this;

        thisWidget.dom.input.value = thisWidget.value;
    }


    initActions() {
        const thisWidget = this;

        // Set up event listeners for input and buttons
        thisWidget.dom.input.addEventListener('change', function () {
            // thisWidget.setValue(thisWidget.dom.input.value);
            thisWidget.value = thisWidget.dom.input.value;
        });

        thisWidget.dom.linkDecrease.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default action
            thisWidget.setValue(thisWidget.value - 1); // Decrease the value
        });

        thisWidget.dom.linkIncrease.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default action
            thisWidget.setValue(thisWidget.value + 1); // Increase the value
        });
    }

}

export default AmountWidget;
