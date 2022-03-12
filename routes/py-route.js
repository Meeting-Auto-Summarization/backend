const express = require('express');
const router = express.Router();
const pyController = require('../controllers/py-controller');

router.get('/script-docx', pyController.generateScriptDocx);
router.get('/report-docx', pyController.generateReportDocx);

router.get('/script-txt', pyController.generateScriptTxt);
router.get('/report-txt', pyController.generateReportTxt);

router.post('/summarize', pyController.generateSummary);

module.exports = router;