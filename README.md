# Movie-Weekend-Planner-Server
A Node.js server for the Movie Weekend Planner. It allows users to browse streaming services and movies, place orders, and view sales statistics.

# Files and Descriptions
server.js — Creates the server, handles requests, processes orders, and provides statistics.

interact.js — Handles the order form and communicates with the server.

orderForm.html — Contains the movie order form.

styles.css — Provides styling for the website.

streamingServices/ — Contains JSON files with information about the streaming services and movies.

remove, selected, unselected/ — Contains images used by the website.

# Compilation and Execution

The program uses Node.js to run the server.

In the terminal, run:

node server.js

Then open:

http://localhost:3000/

Order and sales data are stored in memory and are reset when the server is restarted.
