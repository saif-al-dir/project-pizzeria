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

        // Initialize widgets with null checks
        if (thisBooking.dom.peopleAmount) {
            thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        }

        if (thisBooking.dom.hoursAmount) {
            thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        }

        if (thisBooking.dom.datePickerWrapper) {
            thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerWrapper);
        }

        if (thisBooking.dom.hourPickerWrapper) {
            thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerWrapper);
        }

        // Only add event listeners if widgets initialized
        if (thisBooking.datePicker && thisBooking.datePicker.dom.input) {
            thisBooking.datePicker.dom.input.addEventListener('change', function () {
                thisBooking.updateDOM();
            });
        }

        if (thisBooking.hourPicker && thisBooking.hourPicker.dom.input) {
            thisBooking.hourPicker.dom.input.addEventListener('input', function () {
                thisBooking.updateDOM();
            });
        }

        // Initialize table selection
        thisBooking.initTables();

        // Add submit button event listener
        if (thisBooking.dom.submitButton) {
            thisBooking.dom.submitButton.addEventListener('click', function (event) {
                event.preventDefault();
                thisBooking.sendBooking();
            });
        }

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

    // FIXED: async method properly defined
    async getData() {
        const thisBooking = this;

        try {
            const minDateStr = utils.dateToStr(thisBooking.datePicker.minDate);
            const maxDateStr = utils.dateToStr(thisBooking.datePicker.maxDate);

            // Fetch bookings
            const { data: bookings, error: bookingsError } = await window.supabase
                .from('bookings')
                .select('*')
                .gte('date', minDateStr)
                .lte('date', maxDateStr);

            if (bookingsError) throw bookingsError;

            // Fetch all events
            const { data: events, error: eventsError } = await window.supabase
                .from('events')
                .select('*');

            if (eventsError) throw eventsError;

            // Separate events
            const eventsCurrent = events.filter(e =>
                e.date && e.date >= minDateStr && e.date <= maxDateStr && !e.repeat
            );

            const eventsRepeat = events.filter(e =>
                e.repeat && e.repeat === 'daily'
            );

            thisBooking.parseData(bookings || [], eventsCurrent, eventsRepeat);
        } catch (error) {
            console.error('Error fetching booking data:', error);
        }
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};

        // Use table_number instead of table
        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table_number);
        }

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table_number);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat === 'daily') {
                for (let loopDate = new Date(minDate); loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(
                        utils.dateToStr(loopDate),
                        item.hour,
                        item.duration,
                        item.table_number
                    );
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

    // FIXED: async method properly defined
    async sendBooking() {
        const thisBooking = this;

        // Show loading state
        thisBooking.dom.submitButton.classList.add('loading');

        // Validate form
        if (!thisBooking.selectedTable) {
            thisBooking.dom.submitButton.classList.remove('loading');
            window.toast?.error('Please select a table');
            return;
        }

        if (!thisBooking.dom.phone.value || thisBooking.dom.phone.value.length < 10) {
            thisBooking.dom.submitButton.classList.remove('loading');
            window.toast?.error('Please enter a valid phone number');
            return;
        }

        if (!thisBooking.dom.address.value || thisBooking.dom.address.value.length < 5) {
            thisBooking.dom.submitButton.classList.remove('loading');
            window.toast?.error('Please enter a valid address');
            return;
        }

        const bookingData = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table_number: parseInt(thisBooking.selectedTable.getAttribute('data-table')),
            duration: thisBooking.hoursAmountWidget.value,
            ppl: thisBooking.peopleAmountWidget.value,
            starters: thisBooking.getStarters(),
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value,
        };

        try {
            const { data, error } = await window.supabase
                .from('bookings')
                .insert([bookingData])
                .select();

            if (error) throw error;

            console.log('Booking successful:', data);

            thisBooking.makeBooked(
                data[0].date,
                data[0].hour,
                data[0].duration,
                data[0].table_number
            );

        // Update DOM to show table as booked
            thisBooking.updateDOM();
            
            // Show success effects
            thisBooking.showSuccessEffects(bookingData);
            
            // Clear form
            thisBooking.clearForm();
            
        } catch (error) {
            console.error('Error saving booking:', error);
            window.toast?.error('Booking failed. Please try again.');
        } finally {
            thisBooking.dom.submitButton.classList.remove('loading');
        }
    }

    // NEW: Success effects method
    showSuccessEffects(bookingData) {
        const thisBooking = this;
        
        // 1. Create confetti
        thisBooking.createConfetti();
        
        // 2. Flash the selected table
        if (thisBooking.selectedTable) {
            thisBooking.selectedTable.classList.add('selected');
            setTimeout(() => {
                thisBooking.selectedTable.classList.remove('selected');
            }, 1000);
        }
        
        // 3. Show success modal
        thisBooking.showSuccessModal(bookingData);
        
        // 4. Highlight success fields
        thisBooking.dom.phone.classList.add('success');
        thisBooking.dom.address.classList.add('success');
        
        setTimeout(() => {
            thisBooking.dom.phone.classList.remove('success');
            thisBooking.dom.address.classList.remove('success');
        }, 2000);
        
        // 5. Show toast notification
        if (window.toast) {
            window.toast.success('Table booked successfully!');
        }
    }

    // NEW: Create confetti effect
    createConfetti() {
        const container = document.querySelector('.booking-widget');
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            container.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 1000);
        }
    }

    // NEW: Show success modal
    showSuccessModal(bookingData) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'booking-success-overlay';
        
        // Format date and time
        const date = new Date(bookingData.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Create modal content
        modal.innerHTML = `
            <div class="booking-success-modal">
                <i class="fas fa-check-circle"></i>
                <h3>Booking Confirmed!</h3>
                <p>Your table has been successfully booked.</p>
                <div class="booking-details">
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${bookingData.hour}</p>
                    <p><strong>Table:</strong> ${bookingData.table_number}</p>
                    <p><strong>People:</strong> ${bookingData.ppl}</p>
                    <p><strong>Duration:</strong> ${bookingData.duration} hours</p>
                </div>
                <button class="btn-secondary" onclick="this.closest('.booking-success-overlay').remove()">
                    Great!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 5000);
    }

    // NEW: Clear form method
    clearForm() {
        const thisBooking = this;
        
        // Clear phone and address
        thisBooking.dom.phone.value = '';
        thisBooking.dom.address.value = '';
        
        // Uncheck starters
        thisBooking.dom.starters.forEach(cb => cb.checked = false);
        
        // Reset people and hours to 1
        thisBooking.peopleAmountWidget.value = 1;
        thisBooking.hoursAmountWidget.value = 1;
        
        // Deselect table
        if (thisBooking.selectedTable) {
            thisBooking.selectedTable.classList.remove('selected');
            thisBooking.selectedTable = null;
        }
    }
}

export default Booking;