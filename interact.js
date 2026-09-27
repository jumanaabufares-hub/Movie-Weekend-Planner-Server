
const serviceSelect = document.getElementById("serviceSelect");
const serviceName = document.getElementById("serviceName");
const minOrder = document.getElementById("minOrder");
const serviceFee = document.getElementById("serviceFee");
const genreList = document.getElementById("genreList");
const moviesContainer = document.getElementById("moviesContainer");
const orderList = document.getElementById("orderList");
const feesTotal = document.getElementById("total-fees");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const minOrderMsg = document.getElementById("minOrderMsg");
const submitOrderBtn = document.getElementById("submitOrder");

let currentService = null;  // This will hold the currently-selected streaming service
let currentGenre = null;    // This will hold the current genre selected 
let currentOrder = [];      // Will change below to have keys matching streaming service names

let servicesList = [];



//list of streaming-services used to populate the drop-down menu must be requested from the server
//ONLY request the name, id, minOrder and serviceFee of each service
    //using fetch().then().catch()
window.onload = function() {
    fetch("/services")
        .then(function(response) {
            return response.json();
        })
        .then(function(data)// name, id, minOrder and serviceFee 
        {
            servicesList = data;
            for (let i = 0; i < data.length; i++) {

                const option = document.createElement("option");
                option.value = data[i].id;   
                option.textContent = data[i].name;
                serviceSelect.appendChild(option);

                currentOrder[servicesList[i].name] = [];
            }

        })
        .catch(function(error) {
            console.log("Error: ", error);
        });

};


/*
// Populate the streaming service dropdown list and prepare a blank order
streamingServices.forEach((service, index) => {
    // Make an option element in the select element for each service
    const option = document.createElement("option");
    option.value = index;
    option.textContent = service.name;
    serviceSelect.appendChild(option);

    // Prepare an object to keep the orders separate per service
    // {"Stream It": [], "Movie Verse": [], "Cinema Time": []}
    currentOrder[service.name] = [];
});
*/

// This is the event handler for when selecting a Streaming Service 


//When a streaming-service is selected, 
//the new streaming-service genre and movie data must be requested
serviceSelect.addEventListener("change", function() {

    if (!serviceSelect.value) return;

    fetch("/services?id=" + serviceSelect.value)
        .then(function(response) {

            if (!response.ok) {
                throw new Error("service not found");
            }

            return response.json();
        })
        .then(function(serviceData) {

            currentService = serviceData;
            // Update the contents on the page according to the selected service

            displayServiceInfo(serviceData);
            displayGenres(serviceData);

            currentGenre = "All";
            displayMovies(serviceData);

        }
    )
        .catch(function(error) {
            console.log("error:", error);
        });

});

/*serviceSelect.addEventListener("change", () => {
    if (serviceSelect.value) {
        currentService = streamingServices[serviceSelect.value];

        // Update the contents on the page according to the selected service
        displayServiceInfo(currentService);
        displayGenres(currentService);
        displayMovies(currentService);
    }
});*/

// This displays the service name in the dropdown list as well as the Minimum order and service fee
function displayServiceInfo(service) {
    serviceName.textContent = service.name;
    minOrder.textContent = `Minimum Order: $${service.minOrder.toFixed(2)}`;
    serviceFee.textContent = `Service Fee: $${service.serviceFee.toFixed(2)}`;
}

// This displays the genres for the selected streaming service in a list
function displayGenres(service) {
    genreList.innerHTML = "";

    // Add an "All" list item to the genres list
    const li = document.createElement("li");
    li.textContent = "All";
    li.addEventListener("click", () => { // Handle clicking "All"
        currentGenre = "All";   
        displayMovies(service);
    });
    genreList.appendChild(li);

    // Now add a list item for each genre from the service
    Object.keys(service.genres).forEach(genre => {
        const li = document.createElement("li");
        li.textContent = genre;
        li.addEventListener("click", () => { // Handle clicking the genre
            currentGenre = genre;
            displayMovies(service);
        });
        genreList.appendChild(li);
    });
}

// Choose the icon to show based on whether the movie has been added to the order or not
function chooseMovieIcon(movie) {
    // If the movie is already in the order list, show as selected image otherwise as unselected
    for (const mvs of Object.values(currentOrder)) {
        for (const m of mvs) {
            if (m.id === movie.id) {
                return "selected.svg"; 
            }
        };
    };
    return "unselected.svg";
}



// Update the contents of the movies DIV
function displayMovies(service) {
    moviesContainer.innerHTML = ""; // Erase what is currently there

    // Go through every genre of every streaming service as a service/genre pair
    Object.entries(service.genres).forEach(([genre, movies]) => {
        // Only add movies to the list of the genre matches the 
        // currently-selected one (or if the current one is "All")
        if (currentGenre === "All" || currentGenre === genre) {
            // Change the title of the movies column to add the genre
            document.getElementById("movie-list").textContent = currentGenre + " Movies";

            // Create a container to hold the movies
            const genreSection = document.createElement("div");
        
            // Create the unordered list and add each movie to it
            const ul = document.createElement("ul");
            movies.forEach(movie => {
                // Create a list item for the movie
                const li = document.createElement("li");
                li.className = "movie-item"; // set the class name so that we can style it
                li.dataset.id = movie.id;    // add the id to the element's data set

                // Create the image and choose the appropriate icon to place beside it
                const img = document.createElement("img");
                img.src = chooseMovieIcon(movie);
                img.className = "select-img"; // set the class name so that we can style it

                // Add an event handler to handle selecting of the movie image
                img.addEventListener("click", () => toggleMovieSelection(movie, img));

                // The list item will show the movie title, description and price
                li.innerHTML = `<span class="movie-title">${movie.title} (${movie.year})</span>
                            <p class="movie-desc">${movie.description}</p>
                            <span class="movie-price">$${movie.price.toFixed(2)}</span>`;
                li.prepend(img); // Put the image before the text
                ul.appendChild(li);
            });
            genreSection.appendChild(ul);
            moviesContainer.appendChild(genreSection);
        };
    });
}

// This handles the selection of a movie icon to add/remove it from the order
// The movie is the one to be toggled and the imgEl is the icon on its left
function toggleMovieSelection(movie, imgEl) {
    // Check to see if the movie has already been ordered for the currently selected service
    const index = currentOrder[currentService.name].findIndex(item => item.id === movie.id);

    // If it has not been ordered, show it as selected and add it to the order
    if (index === -1) {
        currentOrder[currentService.name].push(movie);
        imgEl.src = "selected.svg";
    } else {
        // If it has already been ordered, remove it from the order and show as unselected
        currentOrder[currentService.name].splice(index, 1); // remove 1 element at the index
        imgEl.src = "unselected.svg";
    }
    // Upate the order now
    updateOrderSummary();
}

// Re-display all of the order information
function updateOrderSummary() {
    // Erase what was there before
    orderList.innerHTML = "";

    // Go through the order ine service at a time
    for (const key in currentOrder) {
        let mvs = currentOrder[key];
        // Go through each movie for the service
        for (let i=0; i<mvs.length; i++) {
            const movie = mvs[i];
            const li = document.createElement("li"); // Create a list item
            li.dataset.id = movie.id; // Store the movie ID as data so we can update it's image at any time

            // Show the movie information, along with a remove image
            li.innerHTML = `<img src="remove.svg" class="remove-img" alt="Remove"> ${movie.title} (${movie.year}) - $${movie.price.toFixed(2)}`;
            
            // Add an event listener to allow the movie to be removed from the order
            li.querySelector("img").addEventListener("click", () => {
                // Double-check if it is to be removed by using a confirmation dialog
                if (confirm(`Remove "${movie.title}" from order?`)) {
                    // Update the list to have all movies except the one that was selected
                    mvs.splice(i, 1);
                    mvs = mvs.filter(m => m.id !== movie.id);
                    // Update the movies's selected icon in the movie list to be unselected
                    const movieItem = document.querySelector(`.movie-item[data-id='${movie.id}'] img`);
                    if (movieItem) // Make sur ethe movie is there ... it should always be
                        movieItem.src = "unselected.svg";
                    updateOrderSummary(); // Re-draw everything again
                }
            });
            orderList.appendChild(li); // add the list item
        };
    };

    
    // Add the service fee if there are movies from that service 
    let serviceFeeAmt = { };
    let feeTotal = 0;
    let feeString = ""; // This will show all fees (potentially one for each service)
    // Go through each service and build up the fee string
    for (let i = 0; i < servicesList.length; i++) {
        const service = servicesList[i];
        // In there are any movies ordered from this service then add that service fee
        if (currentOrder[service.name].length > 0) {
            const n = service.name;
            //serviceFeeAmt = serviceFeeAmt + { n: service.serviceFee };

            // Append a plus sign if there was already a service fee added
            if (feeString.length > 0) 
                feeString += " + ";
            feeString = feeString + "$" +  service.serviceFee.toFixed(2) + "";

            // Tally up the fee total while we are at it
            feeTotal += service.serviceFee;
        }
    };
    
    // Calculate how much has been ordered from each service, 
    // so we can determine if the minimum order amount has been reached.
    let totalPerService = { };
    Object.entries(currentOrder).forEach(([serviceName, mvs]) => {
        let cost = 0;
        mvs.forEach(movie => {
            cost += movie.price;
        });
        totalPerService[serviceName] = cost;
        console.log(totalPerService[serviceName]);
    });

    // Make sure that the minimum order amount has been reached for each service ordered from
    minOrderMsg.innerHTML = ""; // Start off assuming all min order requirements have been met
    for (let i = 0; i < servicesList.length; i++) {
        const service = servicesList[i];  //instead of   const service = streamingServices[key]; , only serevr can use streamingServices
        if (totalPerService[service.name] > 0 && totalPerService[service.name] < service.minOrder) {
            // Hide the submit button
            submitOrderBtn.classList.add("hidden"); 
            // Determine how much remains to meet the min requirement
            const remaining = service.minOrder - parseFloat(totalPerService[service.name]);
            // Add an appropriate message
            minOrderMsg.innerHTML += "Add $" + remaining.toFixed(2) + " more from '" + 
                                     service.name + "' service to meet minimum order requirement.<br>";
        }
    };


    // Go through all services and get the movies then total up the prices
    let subtotal = Object.values(currentOrder).flat().reduce((sum, movie) => sum + movie.price, 0);

    // Add the fees and taxes
    subtotal += feeTotal;
    const tax = subtotal * 0.13;
    const total = subtotal + tax;

    // update the HTML elements accordingly
    if (total > 0) {
        feesTotal.textContent = "Total fees: (" + feeString + ") =  $" + feeTotal.toFixed(2);
        subtotalEl.textContent = "Subtotal: $" + subtotal.toFixed(2);
        taxEl.textContent = "Tax (13%): $" + tax.toFixed(2);
        totalEl.textContent = "Total: $" + total.toFixed(2);
        
        // If there were no messages added, then all is ok and we can submit
        if (minOrderMsg.innerHTML.length === 0) {
            submitOrderBtn.classList.remove("hidden");
        }
    }
    else {
        feesTotal.textContent = "";
        subtotalEl.textContent = "";
        taxEl.textContent = "";
        totalEl.textContent = "";
    }
}

// Handle the placing of the order
submitOrderBtn.addEventListener("click", () => {
    

    let selectedServiceName = currentService.name;
    let selectedMovies = currentOrder[selectedServiceName];

    let orderObject = {
        service: selectedServiceName,
        movies: selectedMovies,
        subtotal: 0,
        total: 0
    };

    let subtotal = 0;

    for (const key in currentOrder) {
        currentOrder[key].forEach(movie => {
            subtotal += movie.price;
        });
    }

    orderObject.subtotal = subtotal;

    orderObject.total = subtotal * 1.13; //total pricetax included


    fetch("http://localhost:3000/submit-order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderObject)
    })
    .then(function(response) {
        return response.text();
    })
    .then(function(data) {

        alert("Order submitted successfully!");
        resetPage(); // client's page must be reset to its initial state

    })
    .catch(function(error) {
        console.log("Error: ", error);
    });


});

// Reset the page after an order has been placed
function resetPage() {
    serviceSelect.value = "";
    currentService = null;
    // Delete the order
    for(let i =0; i<servicesList.length;i++){
        currentOrder[servicesList[i].name]=[];
    }
    
    serviceName.textContent = "";
    minOrder.textContent = "";
    serviceFee.textContent = "";
    genreList.innerHTML = "";
    moviesContainer.innerHTML = "";
    submitOrderBtn.classList.add("hidden");

    document.getElementById("movie-list").textContent = "Movies";

    updateOrderSummary();
}