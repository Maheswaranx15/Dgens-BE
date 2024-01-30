import express, { Router } from 'express';
import auth from '../middleware/auth'
import { setBanner, getBanners } from '../controllers/banner.controller';
import { adminAuth } from '../middleware/rolesAuth';
const router: Router = express.Router()

// Sends post request to set banner
router.post('/set', auth, adminAuth, setBanner)

// sends get request to get auth banner
router.get('/get', getBanners)

export default router