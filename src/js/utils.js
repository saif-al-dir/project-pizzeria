const utils = {
    createDOMFromHTML: function(htmlString) {
        const div = document.createElement('div'); // Create a new div element
        div.innerHTML = htmlString; // Set the innerHTML to the provided HTML string
        return div.firstChild; // Return the first child element (the actual DOM element)
    }
};

// Export the utils object if you're using modules
export { utils };