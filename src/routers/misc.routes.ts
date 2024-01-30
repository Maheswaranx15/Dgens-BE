import express, { Router } from 'express';
import { createFrontEndSession } from '../controllers/frontEndSession.controller';
import { filterActivities } from '../controllers/activities.controller';
import commonAuth from '../middleware/commonAuth';
import { getCollectionNames } from '../controllers/misc.controllers';
const router: Router = express.Router()

// Sends post request to create new front end session
router.post('/front-end-session/create', createFrontEndSession)

// Sends get request to get activities
router.get('/activities/get', commonAuth, filterActivities)

// Sends get request to get collection names
router.get('/collection-names/get', getCollectionNames)

export default router