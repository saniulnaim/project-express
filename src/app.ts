
import express from 'express'; // for request handling and routing and run server
import helmet from 'helmet'; // set security headers to protect the app from well-known web vulnerabilities
import cors from 'cors'; // communication between different origins (fe and be)

// app is the main entry point ot the application
const app = express(); // to create an instance of the express application
// Builder Pattern

// registering middleware (by app.use method) to the application (work like a middleman between the request and response)
app.use(helmet());
app.use(cors());
app.use(express.json()); // JSON request body parse করে, যদি থাকে

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    framework: 'Express.js',
    message: 'Backend is running',
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
