import express, { Router } from 'express';
import { createAPI, filterAllAPIs, filterAPIs } from '../controllers/api.controller';
import auth from '../middleware/auth';
import { adminAuth } from '../middleware/rolesAuth';
const router: Router = express.Router()

// Sends post request to create new api
router.post('/create', auth, createAPI)

// Sends get request to get apis
router.get('/filter-apis', auth, filterAPIs)

// Sends get request to get active apis (ads)
router.get('/filter-all-apis', auth, adminAuth, filterAllAPIs)

export default router