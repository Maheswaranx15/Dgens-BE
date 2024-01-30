import express, { Router } from 'express';

const adminEmail: any = process.env.EMAIL_ADDRESS
const frontendLocation: any = process.env.FRONT_END_LOCATION
const siteName: any = process.env.SITE_NAME
const host: any = process.env.HOST

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

export default router