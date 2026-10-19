
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

// http://localhost:3000/health
app.get('/health', (_req, res) => {
  res.status(200).json({
    message: 'Hello from Express',
  });
});

// Route parameter: http://localhost:3000/users/2
app.get('/users/:id', (req, res) => {
  const id = req.params.id;
  res.json({ userId: id });
});

// Query parameter: http://localhost:3000/search?keyword=express
app.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  res.json({ keyword });
});

// Request body: http://localhost:3000/echo 
// {
//   "name": "Learn Express",
//   "completed": false
// }   
app.post('/echo', (req, res) => {
  res.json({
    received: req.body,
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
