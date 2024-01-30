import express, { Router } from 'express';
import { getCollectionsList, getHistoryGraph } from '../controllers/price-impact.controller';
const router: Router = express.Router()

// Sends get request to get price impact list
router.get('/get-collections-list', getCollectionsList)

// Sends post request to get listings and floor price history
router.post('/get-history-graph', getHistoryGraph)

export default router