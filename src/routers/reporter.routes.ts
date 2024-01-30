import express, { Router } from 'express';
import auth from '../middleware/auth'
import { checkReporterExistence, createReporter, deleteReporter, editReporter, editUsernameReporter, filterReporter, findReporter, getAdminDashboardData, getManageReportersDashboardData, getReporter, getReporterDashboardData, loginReporter, logoutReporter, payReporter, removeReporterImage, getReporters, resetReporterSocials, saveReporterImage, getJuniorsForPayoutAll } from '../controllers/reporter.controller';
import { multerUploads } from '../helpers/multer';
import { adminAuth } from '../middleware/rolesAuth';
const router: Router = express.Router()

// Sends post request to create new reporter
// router.post('/create', createReporter)
router.post('/create', auth, adminAuth, createReporter)

// sends get request to edit auth reporter
router.patch('/edit', auth, adminAuth, editReporter)

// Sends post request to log reporter in
router.post('/login', loginReporter)

// Sends post request to log reporter out
router.post('/logout', auth, logoutReporter)

// sends get request to fetch auth reporter
router.get('/get', auth, getReporter)

// sends get request to fetch auth reporter dashboard
router.get('/get-dashboard', auth, getReporterDashboardData)

// sends get request to fetch auth admin dashboard
router.get('/get-admin-dashboard', auth, adminAuth, getAdminDashboardData)

// sends post request to pay a reporter
router.post('/pay-reporter', auth, adminAuth, payReporter)

// sends get request to fetch manage reporters dashboard
router.get('/get-manage-reporters-dashboard', auth, adminAuth, getManageReportersDashboardData)

// sends get request to find a reporter
router.get('/find', findReporter)

// sends get request to filter reporters
router.get('/filter', filterReporter)

// sends get request to filter reporters
router.get('/reporters', getReporters)

// sends get request to filter reporters
router.get('/juniors', getJuniorsForPayoutAll)

// Sends delete request to delete reporter
router.delete('/delete', auth, adminAuth, deleteReporter)

// sends delete request to remove reporter discord/twitter data
router.delete('/reset-socials', auth, resetReporterSocials)

// sends get request to check reporter existence
router.get('/exists', checkReporterExistence)

// Sends post request to edit reporter username 
router.patch('/change-username', auth, editUsernameReporter)

// Sends post request to create and upload the reporters profile avatar
router.post('/avatar/upload', auth, multerUploads, saveReporterImage)

// Sends delete request to delete the reporters profile avatar
router.delete('/avatar/remove', auth, removeReporterImage)

export default router