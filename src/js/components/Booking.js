import { select, templates, settings } from '../settings.js'; // Adjust the path as necessary
import AmountWidget from './AmountWidget.js'; // Import the AmountWidget class
import DataPicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import BaseWidget from './BaseWidget.js';

class Booking extends BaseWidget {
    constructor(element) {
        super(element, settings.amountWidget.defaultValue);

        this.dom = {};
        this.element = element;
        this.dom.wrapper = element;
        this.render();
        this.initWidgets();
    }

    render() {
        const generatedHTML = templates.bookingWidget();
        this.dom.wrapper.innerHTML = generatedHTML;

        // Przygotowanie referencji do inputów
        this.dom.peopleAmount = this.dom.wrapper.querySelector(select.booking.peopleAmount);
        this.dom.hoursAmount = this.dom.wrapper.querySelector(select.booking.hoursAmount);
        this.dom.datePickerWrapper = this.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        this.dom.hourPickerWrapper = this.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    }

    initWidgets() {
        // Inicjalizacja widgetów
        this.peopleAmountWidget = new AmountWidget(this.dom.peopleAmount);
        this.hoursAmountWidget = new AmountWidget(this.dom.hoursAmount);
        this.datePicker = new DataPicker(this.dom.datePickerWrapper);
        this.hourPicker = new HourPicker(this.dom.hourPickerWrapper);
    }
}

export default Booking;