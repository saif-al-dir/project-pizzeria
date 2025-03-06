import { select } from '../settings.js'; // Adjust the path as necessary
import AmountWidget from './AmountWidget.js'; // Import the AmountWidget class
import { templates } from '../settings.js';


class Booking {
    constructor(element) {
        this.dom = {};
        this.dom.wrapper = element; // Referencja do kontenera
        this.render(); // Wywołanie metody render
        this.initWidgets(); // Wywołanie metody initWidgets
    }

    render() {
        // Generowanie HTML na podstawie szablonu
        const generatedHTML = templates.bookingWidget();
        this.dom.wrapper.innerHTML = generatedHTML; // Ustawienie HTML w kontenerze

        // Przygotowanie referencji do inputów
        this.dom.peopleAmount = this.dom.wrapper.querySelector(select.booking.peopleAmount);
        this.dom.hoursAmount = this.dom.wrapper.querySelector(select.booking.hoursAmount);
    }

    initWidgets() {
        // Inicjalizacja widgetów
        this.peopleAmountWidget = new AmountWidget(this.dom.peopleAmount);
        this.hoursAmountWidget = new AmountWidget(this.dom.hoursAmount);
    }
}

export default Booking; // Eksport klasy