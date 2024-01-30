import express, { Router } from 'express';
import { adminPublishReport, adminPublishAllReport, createReport, editReport, filterNews, filterReports, getBreakingReport, getReport, juniorDisputeReport, seniorValidateReport, setBreakingReport, tipReport, mintReport, adminRejectReport } from '../controllers/report.controller';
import auth from '../middleware/auth';
import { multerUploads } from '../helpers/multer';
import { adminAuth, juniorAuth, reporterAuth, seniorAuth } from '../middleware/rolesAuth';
const router: Router = express.Router()

// Sends get request to get a report
router.get('/get-report', getReport)

// Sends get request to get reports
router.get('/filter-reports', filterReports)

// Sends get request to get published reports
router.get('/filter-news', filterNews)

// Sends get request to place a report on the breaking news bar
router.get('/get-breaking', getBreakingReport)

// Sends post request to create new report
router.post('/create', auth, reporterAuth, multerUploads, createReport)

// Sends patch request to edit report
router.patch('/edit', auth, reporterAuth, multerUploads, editReport)

// Sends post request to make a dispute
router.post('/junior-dispute', auth, juniorAuth, juniorDisputeReport)

// Sends post request to approve or reject report
router.post('/senior-validate', auth, seniorAuth, multerUploads, seniorValidateReport)

// Sends post request to reject report
router.post('/admin-reject', auth, adminAuth, adminRejectReport)

// Sends post request to publish report
router.post('/admin-publish', auth, adminAuth, multerUploads, adminPublishReport)
router.post('/admin-publish-all', auth, adminAuth, adminPublishAllReport)

// Sends post request to tip a report
router.post('/tip', tipReport)

// Sends post request to mint a report
router.post('/mint', mintReport)

// Sends post request to place a report on the breaking news bar
router.post('/set-breaking', auth, adminAuth, setBreakingReport)

export default router