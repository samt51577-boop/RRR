const express = require('express');
const router = express.Router();
const handicapController = require('../controllers/handicapController');

// Define the route with a parameter for the member's ID
router.get('/:memberId', handicapController.getHandicap);

module.exports = router;
