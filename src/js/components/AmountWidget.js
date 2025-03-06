import { settings, select } from "../settings.js";

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
        thisWidget.input.addEventListener('change', function () {
            thisWidget.setValue(thisWidget.input.value);
        });

        thisWidget.linkDecrease.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default action
            thisWidget.setValue(thisWidget.value - 1); // Decrease the value
        });

        thisWidget.linkIncrease.addEventListener('click', function (event) {
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

export default AmountWidget;
