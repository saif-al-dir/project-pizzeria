
class BaseWidget {
    constructor(wrapperElement, initialValue) {
        const thisWidget = this;

        thisWidget.dom = {};
        thisWidget.dom.wrapper = wrapperElement;

        thisWidget.correctValue = initialValue;
    }

    get value() {
        const thisWidget = this;

        return thisWidget.correctValue;
    }

    set value(value) {
        const thisWidget = this;
        const newValue = thisWidget.parseValue(value); // Convert the input value to an integer

        // Validate the new value
        if (newValue != thisWidget.correctValue && thisWidget.isValid(newValue)) {
            thisWidget.correctValue = newValue; // Update the value
            // thisWidget.renderValue(); // Update the input field
            thisWidget.announce(); // Notify that the value has changed
        }

        thisWidget.renderValue(); // Update the input field
        // else {
        //     thisWidget.renderValue(); // Restore the previous value if invalid
        // }
    }

    setValue(value) {
        const thisWidget = this;

        thisWidget.value = value;
    }

    // setValue(value) {
    //     const thisWidget = this;
    //     const newValue = parseInt(value); // Convert the input value to an integer

    //     // Validate the new value
    //     if (newValue != thisWidget.value && thisWidget.isValid(newValue)) {
    //         thisWidget.value = newValue; // Update the value
    //         thisWidget.dom.input.value = thisWidget.value; // Update the input field
    //         thisWidget.announce(); // Notify that the value has changed
    //     } else {
    //         thisWidget.dom.input.value = thisWidget.value; // Restore the previous value if invalid
    //     }
    //     thisWidget.renderValue();
    // }

    parseValue(value) {
        return parseInt(value);
    }

    isValid(value) {
        return !isNaN(value);
    }

    renderValue() {
        const thisWidget = this;

        thisWidget.dom.wrapper.innerHTML = thisWidget.value;
    }

    announce() {
        const thisWidget = this;
        const event = new CustomEvent('updated', {
            bubbles: true
        });
        thisWidget.dom.wrapper.dispatchEvent(event);
    }
}

export default BaseWidget;