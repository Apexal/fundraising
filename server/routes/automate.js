const express = require('express');
const router = express.Router();
const config = require('config');

/* Validate request */
router.use((req, res, next) => {
  if (req.body.secret == config.get('secret')) return next();
  
  res.status(500);
  res.json({ error: 'Invalid secret.' });
});

/* Transfer from survey monkey to website */
router.post('/transfer', (req, res, next) => {
  // Create user
  // Invite to slack
  // Send emails
});

module.exports = router;
