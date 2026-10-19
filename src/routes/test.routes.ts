import { Router } from 'express';

const router = Router();
// Route parameter: http://localhost:3000/users/2
router.get('/users/:id', (req, res) => {
  const id = req.params.id;
  res.json({ userId: id });
});

// Query parameter: http://localhost:3000/search?keyword=express
router.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  res.json({ keyword });
});

// Request body: http://localhost:3000/echo 
// {
//   "name": "Learn Express",
//   "completed": false
// }   
router.post('/echo', (req, res) => {
  res.json({
    received: req.body,
  });
});

export default router;