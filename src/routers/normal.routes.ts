import express, { Router } from 'express';
import isURL from 'validator/lib/isURL';
import Campaign from '../models/Campaign';

const adminEmail = process.env.EMAIL_ADDRESS
const frontendLocation = process.env.FRONT_END_LOCATION
const siteName = process.env.SITE_NAME
const host = process.env.HOST

const sitePackage = {
  adminEmail, frontendLocation, siteName, host,
  description: `The backend side of ${siteName}`,
}

const router: Router = express.Router()

router.get('/', async (req, res) => {
  res.render('index', {
    ...sitePackage
  })
})

router.get('/track-ad-visits', async (req, res) => {
  const _id = req.query._id
  const adUrl = req.query.url

  try {
    if (typeof _id !== "string") throw new Error("Invalid _id");
    if (typeof adUrl !== "string") throw new Error("Invalid adUrl");

    const campaign = await Campaign.findOneAndUpdate({ _id, website: adUrl }, {
      $push: { clicks: {} }
    })
    if (!campaign) throw new Error("Invalid details");

    let redirectLink = (typeof adUrl === "string" && isURL(adUrl)) ? adUrl : (frontendLocation ?? "")
    redirectLink = redirectLink.startsWith("http") ? redirectLink : "https://" + redirectLink
    res.redirect(302, redirectLink);
  } catch (error) {
    let redirectLink = frontendLocation ?? ""
    redirectLink = redirectLink.startsWith("http") ? redirectLink : "https://" + redirectLink
    res.redirect(302, redirectLink);
  }
})

export default router