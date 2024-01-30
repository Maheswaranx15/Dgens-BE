import express, { Router } from 'express';
import { createFrontEndSession } from '../controllers/frontEndSession.controller';
const router: Router = express.Router()

// Sends post request to create new reporter
router.post('/create', createFrontEndSession)

export default router