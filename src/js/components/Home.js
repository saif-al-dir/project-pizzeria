import { templates } from '../settings.js'; // Adjust the path as necessary


class Home {
    constructor(element) {
        const thisHome = this;

        thisHome.dom = {};
        thisHome.element = element;
        // console.log(thisHome.element);
        thisHome.dom.wrapper = element;
        console.log(thisHome.dom.wrapper);

        thisHome.render();

        // Function to navigate to the booking page
        function navigateToBooking() {
            window.location.href = 'http://localhost:3000/#/booking'; // Set the URL to the booking page
        }

        // Add event listener to the button link
        document.getElementById('booking-link').addEventListener('click', function (event) {
            event.preventDefault(); // Prevent the default anchor behavior
            navigateToBooking(); // Call the function to navigate
        });

        document.querySelectorAll('.gallery-item').forEach(item => {
            const image = item.querySelector('.gallery-img');
            const heart = item.querySelector('.heart');

            image.addEventListener('dblclick', function () {
                // Toggle the 'liked' class on the image and the heart color
                image.classList.toggle('liked');
                heart.style.color = image.classList.contains('liked') ? 'red' : 'transparent';
            });
        });

    }

    render() {
        const thisHome = this;
        const generatedHTML = templates.homePage();

        thisHome.dom.wrapper.innerHTML = generatedHTML;
    }
}

export default Home;