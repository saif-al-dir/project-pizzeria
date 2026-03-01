import { templates, settings, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import BaseWidget from './BaseWidget.js';
import utils from '../utils.js';

class Booking extends BaseWidget {
    constructor(element) {
        super(element, settings.amountWidget.defaultValue);
        const thisBooking = this;

        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.selectedTable = null;

        thisBooking.render();
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    render() {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        // Get references to DOM elements
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector('.people-amount');
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector('.hours-amount');
        thisBooking.dom.datePickerWrapper = thisBooking.dom.wrapper.querySelector('.date-picker');
        thisBooking.dom.hourPickerWrapper = thisBooking.dom.wrapper.querySelector('.hour-picker');
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll('.table');
        thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector('.floor-plan');
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector('input[name="phone"]');
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector('input[name="address"]');
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll('input[name="starter"]');
        thisBooking.dom.submitButton = thisBooking.dom.wrapper.querySelector('.btn-secondary');
    }

    initWidgets() {
        const thisBooking = this;

        // Initialize widgets
        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerWrapper);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerWrapper);

        // Initialize table selection
        thisBooking.initTables();

        // Add event listeners for date and hour changes
        thisBooking.datePicker.dom.input.addEventListener('change', function () {
            thisBooking.updateDOM();
        });

        thisBooking.hourPicker.dom.input.addEventListener('input', function () {
            thisBooking.updateDOM();
        });

        // Add submit button event listener
        thisBooking.dom.submitButton.addEventListener('click', function (event) {
            event.preventDefault();
            thisBooking.sendBooking();
        });

        // Listen for updated events from widgets
        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
        });
    }

    initTables() {
        const thisBooking = this;

        thisBooking.dom.floorPlan.addEventListener('click', function (event) {
            const clickedElement = event.target.closest('.table');

            if (!clickedElement) return; // Clicked on something else

            // Check if table is booked
            if (clickedElement.classList.contains(classNames.booking.tableBooked)) {
                alert('This table is already booked!');
                return;
            }

            // Remove selected class from previously selected table
            if (thisBooking.selectedTable) {
                thisBooking.selectedTable.classList.remove('selected');
            }

            // Select new table or deselect if same table
            if (thisBooking.selectedTable === clickedElement) {
                thisBooking.selectedTable = null;
            } else {
                thisBooking.selectedTable = clickedElement;
                clickedElement.classList.add('selected');
            }
        });
    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [startDateParam, endDateParam],
            eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
            eventsRepeat: [settings.db.repeatParam, endDateParam],
        };

        const urls = {
            booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
        };

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function (allResponses) {
                return Promise.all([
                    allResponses[0].json(),
                    allResponses[1].json(),
                    allResponses[2].json(),
                ]);
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(parseInt(table));
        }
    }

    updateDOM() {
        const thisBooking = this;

        if (!thisBooking.datePicker || !thisBooking.hourPicker) return;

        const currentDate = thisBooking.datePicker.value;
        const currentHour = utils.hourToNumber(thisBooking.hourPicker.value);

        // Reset table selection
        if (thisBooking.selectedTable) {
            thisBooking.selectedTable.classList.remove('selected');
            thisBooking.selectedTable = null;
        }

        // Update table booked status
        for (let table of thisBooking.dom.tables) {
            const tableId = parseInt(table.getAttribute('data-table'));

            let isBooked = false;

            if (thisBooking.booked[currentDate] && thisBooking.booked[currentDate][currentHour]) {
                isBooked = thisBooking.booked[currentDate][currentHour].includes(tableId);
            }

            if (isBooked) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    getStarters() {
        const thisBooking = this;
        const starters = [];

        for (let checkbox of thisBooking.dom.starters) {
            if (checkbox.checked) {
                starters.push(checkbox.value);
            }
        }

        return starters;
    }

    sendBooking() {
        const thisBooking = this;

        // Validate form
        if (!thisBooking.selectedTable) {
            alert('Please select a table');
            return;
        }

        if (!thisBooking.dom.phone.value || thisBooking.dom.phone.value.length < 10) {
            alert('Please enter a valid phone number');
            return;
        }

        if (!thisBooking.dom.address.value || thisBooking.dom.address.value.length < 5) {
            alert('Please enter a valid address');
            return;
        }

        const bookingData = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table: parseInt(thisBooking.selectedTable.getAttribute('data-table')),
            duration: thisBooking.hoursAmountWidget.value,
            ppl: thisBooking.peopleAmountWidget.value,
            starters: thisBooking.getStarters(),
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value,
        };

        const url = settings.db.url + '/' + settings.db.bookings;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Booking successful:', data);
                thisBooking.makeBooked(data.date, data.hour, data.duration, data.table);
                thisBooking.updateDOM();
                alert('Your booking was successful!');

                // Clear form
                thisBooking.dom.phone.value = '';
                thisBooking.dom.address.value = '';
                for (let checkbox of thisBooking.dom.starters) {
                    checkbox.checked = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Booking failed. Please try again later.');
            });
    }
}

export default Booking;