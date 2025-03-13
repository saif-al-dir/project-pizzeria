import { settings, select } from "../settings.js";
import BaseWidget from "./BaseWidget.js";

class AmountWidget extends BaseWidget {
    constructor(element) {
        super(element, settings.amountWidget.defaultValue);
        const thisWidget = this;
        // console.log('This Widget:', thisWidget);

        // Ensure the wrapper is properly initialized
        thisWidget.dom.wrapper = element;
        thisWidget.getElements(); // Get references to the input and buttons
        thisWidget.initActions(); // Set up event listeners

        // console.log('AmountWidget:', thisWidget);
    }

    getElements() {
        const thisWidget = this;

        // Get references to the input and buttons

        thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
        thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
        thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
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

        if (thisWidget.dom.input && thisWidget.dom.linkDecrease && thisWidget.dom.linkIncrease) {
            thisWidget.dom.input.addEventListener('change', function () {
                thisWidget.value = thisWidget.dom.input.value; // This should call setValue
            });

            thisWidget.dom.linkDecrease.addEventListener('click', function (event) {
                event.preventDefault();
                thisWidget.setValue(thisWidget.value - 1);
            });

            thisWidget.dom.linkIncrease.addEventListener('click', function (event) {
                event.preventDefault();
                thisWidget.setValue(thisWidget.value + 1);
            });
        } else {
            // console.warn('One or more DOM elements are missing.');
        }
    }

}

export default AmountWidget;
