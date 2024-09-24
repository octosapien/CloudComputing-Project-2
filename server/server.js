//require dotenv to read .env variables into Node
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 600 }); // TTL set to 10 minutes (600 seconds)

const app = express();
app.use(cors());

//require routes
const medicineRoutes = require("./routes/medicineRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const labCountRoutes = require("./routes/labCountRoutes.js");
const userRoutes = require("./routes/userRoutes");
const reportsStoreRoutes = require("./routes/reportsStoreRoutes");

// middleware
app.use(express.json());

// Cache middleware
const cacheMiddleware = (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        console.log(`Cache hit for ${key}, sending cached response.`);
        // Return cached response if it exists
        return res.status(200).send(cachedResponse);
    } else {
        console.log(`Cache miss for ${key}, generating new response.`);
        // Store the response in cache for future requests
        res.originalSend = res.send;
        res.send = (body) => {
            cache.set(key, body);
            console.log(`Response for ${key} cached.`);
            res.originalSend(body);
        };
        next();
    }
};

app.use((req, res, next) => {
	console.log(req.path, req.method);
	next();
});

// Use caching middleware for all API routes
app.use("/api/medicines", cacheMiddleware, medicineRoutes);
app.use("/api/appointments", cacheMiddleware, appointmentRoutes);
app.use("/api/doctors", cacheMiddleware, doctorRoutes);
app.use("/api/labCounts", cacheMiddleware, labCountRoutes);
app.use("/api/user", cacheMiddleware, userRoutes);
app.use("/api/reportsStore", cacheMiddleware, reportsStoreRoutes);

// connect to db
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log("connected to database");
		// listen to port
		app.listen(process.env.PORT, () => {
			console.log("listening for requests on port", process.env.PORT);
		});
	})
	.catch((err) => {
		console.log(err);
	});
