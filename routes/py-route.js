const express = require('express');
const router = express.Router();
const pyController = require('../controllers/py-controller');

router.get('/docx', pyController.generateDocx);

module.exports = router;