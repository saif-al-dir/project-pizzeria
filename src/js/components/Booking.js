import { select, templates, settings, classNames } from '../settings.js'; // Adjust the path as necessary
import AmountWidget from './AmountWidget.js'; // Import the AmountWidget class
import DataPicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import BaseWidget from './BaseWidget.js';
import utils from '../utils.js';

class Booking extends BaseWidget {
    constructor(element) {
        super(element, settings.amountWidget.defaultValue);
        const thisBooking = this;

        thisBooking.dom = {};
        thisBooking.element = element;
        // console.log(thisBooking.element);
        thisBooking.dom.wrapper = element;
        // console.log(thisBooking.dom.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

        // New property to store selected table
        thisBooking.selectedTable = null; // Store the table reference

        thisBooking.render();
        thisBooking.initWidgets();
        thisBooking.initTables();
        thisBooking.getData();

    }

    // This method will be used to handle table clicks
    initTables() {
        const thisBooking = this;

        thisBooking.dom.wrapper.addEventListener('click', function (event) {
            const clickedElement = event.target;
            console.log(clickedElement);
            // Check if the clicked element is a table
            if (clickedElement.classList.contains(classNames.booking.table)) {
                console.log('This is Table');
                // If the table is booked, alert the user
                if (clickedElement.classList.contains(classNames.booking.tableBooked)) {
                    alert('This table is already booked!');
                    return;
                }

                // If a table was previously selected, remove the 'selected' class from it
                if (thisBooking.selectedTable) {
                    thisBooking.selectedTable.classList.remove('selected');
                }

                // If the same table is clicked again, deselect it
                if (thisBooking.selectedTable === clickedElement) {
                    thisBooking.selectedTable = null;
                } else {
                    // Mark the new table as selected
                    thisBooking.selectedTable = clickedElement;
                    clickedElement.classList.add('selected');
                }
            }
        });
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
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
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

        console.log('thisBooking.booked:', thisBooking.booked);
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            // console.log('loop:', hourBlock);

            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);
        }

        thisBooking.updateDOM();
    }

    sendBooking() {
        const thisBooking = this;

        // Prepare the payload object
        const bookingData = {
            date: thisBooking.datePicker.value, // Date selected by user
            hour: thisBooking.hourPicker.value, // Hour selected by user (in HH:mm format)
            table: thisBooking.selectedTable ? thisBooking.selectedTable.getAttribute('data-table-id') : null, // Table selected by user (or null if no table is selected)
            duration: thisBooking.hoursAmountWidget.value, // Duration selected by user
            ppl: thisBooking.peopleAmountWidget.value, // Number of people selected by user
            starters: thisBooking.getStarters(), // Get starters (checkboxes)
            phone: thisBooking.dom.wrapper.querySelector(select.booking.phone), // Phone number from the form
            address: thisBooking.dom.wrapper.querySelector(select.booking.address), // Address from the form
        };

        // Send the booking data to the server
        fetch('http://localhost:3131/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Booking successful:', data);
                // Add the new booking to thisBooking.booked using the makeBooked method
                thisBooking.makeBooked(data.date, data.hour, data.duration, data.table);
                alert('Your booking was successful!');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Booking failed. Please try again later.');
            });
    }

    updateDOM() {
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if (typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }
            if (!allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }

            // Reset the 'selected' class on all tables when the date/hour changes
            table.classList.remove('selected');
        }

        // Reset the selected table when the DOM is updated
        thisBooking.selectedTable = null;
    }

    render() {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();


        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

        thisBooking.dom.datePickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        console.log(thisBooking.dom.tables);
    }

    initWidgets() {
        const thisBooking = this;
        // Inicjalizacja widgetów
        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DataPicker(thisBooking.dom.datePickerWrapper);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerWrapper);

        // Initialize tables click event delegation
        thisBooking.initTables();

        // Add event listener for booking form submission
        const submitButton = thisBooking.dom.wrapper.querySelector(select.booking.submitButton);
        submitButton.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default form submission
            thisBooking.sendBooking(); // Call sendBooking when the form is submitted
        });

        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
        });
    }

    getStarters() {
        const thisBooking = this;
        const starters = [];

        const startersCheckboxes = thisBooking.dom.wrapper.querySelectorAll(select.booking.startersCheckboxes);
        startersCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                starters.push(checkbox.value);
            }
        });

        return starters;
    }

}

export default Booking;