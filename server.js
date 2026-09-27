const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let streamingServices=[];//to store streaming service
// s
let orderHistory = [];


// Return the Content-type based on the file type. This is needed for static file serving.
function getMimeType(file) {
    const ext = path.extname(file).toLowerCase();
    switch(ext) {
        case '.js': return 'application/javascript';
        case '.css': return 'text/css';
        case '.jpg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.svg': return 'image/svg+xml';
        case '.json': return 'application/json';
        case '.html': return 'text/html';
        default: return 'text/plain';
    }
}

// This function serves all the static files 
function serveStatic(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('File not found');
        } else {
            res.writeHead(200, {'Content-Type': getMimeType(filePath)});
            res.end(data);
        }
    });
}


// Handle all incoming endpoint requests
function handleRequest(req, res) {
    const parsed = url.parse(req.url, true);
    let pathname = parsed.pathname;
    let qdata = parsed.query;

    // Handle all incoming GET requests
    // Get /services
    if (req.method === 'GET' && pathname === "/services") {
        if (!qdata.id) {

            let orderSummary = [];

            for (let i = 0; i < streamingServices.length; i++) {
                orderSummary.push({
                    id: streamingServices[i].id,
                    name: streamingServices[i].name,
                    minOrder: streamingServices[i].minOrder,
                    serviceFee: streamingServices[i].serviceFee
                });
            }

            res.writeHead(200, {"Content-Type": "application/json"});
            return res.end(JSON.stringify(orderSummary));
            
        }
        //find service
         for (let i = 0; i < streamingServices.length; i++) {
            if (streamingServices[i].id == qdata.id) {
                res.writeHead(200, {"Content-Type": "application/json"});
                return res.end(JSON.stringify(streamingServices[i]));
            }
        }
        
        res.writeHead(404, {"Content-Type": "application/json"});
        return res.end(JSON.stringify({ error: "Service not found" }));


    }
    
    //POST /submit-order
    if (req.method === "POST" && pathname === "/submit-order") {

        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            //final body
            const order = JSON.parse(body);

            // store order
            orderHistory.push(order);
            console.log("stored order:", order);

            res.writeHead(200, { "Content-Type": "application/json"});
            res.end("Order received");
        });

        return;
    }




    if (pathname === '/'){
        pathname = "home.html";//server must serve a home page in response to GET requests
        const filePath = path.join(__dirname, pathname);
        return serveStatic(filePath, res);
    }

    if (req.method === "GET" && pathname === "/stats") //request the statistics via this route
        {
        const filePath = path.join(__dirname, "statistics.html");
        return serveStatic(filePath, res);
    }

    if (req.method === "GET" && pathname === "/stats-data")
        {
            let statList=[];
            for (let i = 0; i < streamingServices.length; i++) {

         
                let service = streamingServices[i];

                
                let moviesnum = 0;     
                let totalRevenue = 0;   //subtotal+servicefee
                let ordersNum = 0;   //to get avg cost    
                let movieTitles = []; //for Title of the most frequently ordered movie

            
            for (let j = 0; j < orderHistory.length; j++) {
                // keep movies separate for each  service
                let movies = [];

                if (orderHistory[j].service === service.name) {
                    movies = orderHistory[j].movies;
                }                if (movies.length > 0) {
                    ordersNum++;
                    totalRevenue+=service.serviceFee;
                    //to get total num of movies and revenue
                    for(let k=0;k<movies.length;k++){
                        moviesnum++;
                        totalRevenue+=movies[k].price;//price inside streaming services movies
                        movieTitles.push(movies[k].title);
                    }
                }
            }
        
        //avg cost:
        let avgCost = 0;

        if(ordersNum>0){
             avgCost=totalRevenue/ordersNum;
        }


        // most frequently ordered movie
            let mostOrderedMovie="None";
            let greaterCount=0//intial to get num of times movie is orderd
            let count = {};
    
        for (let title of movieTitles) {
            count[title] = (count[title] || 0) + 1;

            if (count[title] > greaterCount) {
                greaterCount = count[title];
                mostOrderedMovie = title;
            }
        }

        statList.push({
            name: service.name,        
            moviesnum: moviesnum,    
            totalRevenue: totalRevenue,  
            avgCost: avgCost,            
            mostOrderedMovie: mostOrderedMovie        
        });
    }
        
    // /stats-data must return JSON data
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(statList));   
}
    if (req.method === "GET") {
    const filePath = path.join(__dirname, pathname);
    if (fs.existsSync(filePath))//if path exists
        {
        return serveStatic(filePath, res);
    }
}

// Handle anything else as an error
res.writeHead(404, {"Content-Type": "text/plain"});
return res.end("Not Found");
}



//service load
function serviceLoad(callback){
    const filePath = path.join(__dirname, "streamingServices");//to get absolute path to directory
    
    //read in all info in streaming services dir using fs.readdir
    fs.readdir(filePath, (err, d) => {

        if (err) {
            console.error("Error: ", err);
            return;
        }

        let filesProcessed = 0;

        for (let i = 0; i < d.length; i++) {

            const absolutePath = path.join(filePath, d[i]);

            fs.readFile(absolutePath, "utf8", (err, data) => {

                if (err) {
                    console.error("Error reading file:", err);
                    return;
                }

                const service = JSON.parse(data);
                streamingServices.push(service);

                filesProcessed++;

                //server should not start until this initialization process has completed
                if (filesProcessed === d.length) {
                    callback();
                }

            });
        }
    });
}

// --- Start server ---
serviceLoad(function() {

    http.createServer(handleRequest).listen(3000);
    console.log('"Weekend Movie" Planner Server running on http://localhost:3000');

});

