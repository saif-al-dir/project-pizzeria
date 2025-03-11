import { select, templates, settings } from '../settings.js'; // Adjust the path as necessary
import AmountWidget from './AmountWidget.js'; // Import the AmountWidget class
import DataPicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import BaseWidget from './BaseWidget.js';
import utils from '../utils.js';

class Booking extends BaseWidget {
    constructor(element) {
        super(element, settings.amountWidget.defaultValue);

        this.dom = {};
        this.element = element;
        this.dom.wrapper = element;
        this.render();
        this.initWidgets();
        this.getData();

    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);


        const params = {
            booking: [
                startDateParam,
                endDateParam
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };
        // console.log('getData params: params', params);
        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
        };

        // console.log('get data urls:', urls);
        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function (allResponses) {
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat,]) {
                console.log(bookings);
                console.log(eventsCurrent);
                console.log(eventsRepeat);
            });
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