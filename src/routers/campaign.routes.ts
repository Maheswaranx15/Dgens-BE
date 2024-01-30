import express, { Router } from 'express';
import { adminUpdateCampaignStatus, createCampaign, filterAds, filterCampaigns, getCampaign, getCampaignDashboardData, getReporterCampaignDashboardData, impressCampaign, takenCampaigns } from '../controllers/campaign.controller';
import auth from '../middleware/auth';
import { multerDualUploads } from '../helpers/multer';
import { adminAuth } from '../middleware/rolesAuth';
const router: Router = express.Router()

// Sends post request to create new campaign
router.post('/create', auth, multerDualUploads, createCampaign)

// Sends post request to change campaign status
router.post('/update-status', auth, adminAuth, adminUpdateCampaignStatus)

// Sends get request to get campaign
router.get('/get-campaign', getCampaign)

// Sends get request to get campaigns
router.get('/filter-campaigns', filterCampaigns)

// Sends get request to get taken campaigns
router.get('/taken-campaigns', takenCampaigns)

// Sends get request to get active campaigns (ads)
router.get('/filter-ads', filterAds)

// Sends get request to impress the active campaigns (ads)
router.get('/impress-campaign', impressCampaign)

// Sends get request to get reporter ads dashboard
router.get('/reporter-campaign-dashboard', auth, getReporterCampaignDashboardData)

// Sends get request to get ad dashboard
router.get('/campaign-dashboard', auth, getCampaignDashboardData)

export default router