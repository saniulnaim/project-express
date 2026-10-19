
import express from 'express'; // for request handling and routing and run server
import helmet from 'helmet'; // set security headers to protect the app from well-known web vulnerabilities
import cors from 'cors'; // communication between different origins (fe and be)

import routes from './routes/index.js';

// app is the main entry point ot the application
const app = express(); // to create an instance of the express application
// Builder Pattern

// registering middleware (by app.use method) to the application (work like a middleman between the request and response)
app.use(helmet());
app.use(cors());
app.use(express.json()); // JSON request body parse করে, যদি থাকে

app.use(routes);

const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
