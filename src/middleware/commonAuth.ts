import { Response, Request, NextFunction } from 'express';
import { errorJson } from './errors';
import FrontEndSession from '../models/FrontEndSession';
const commonAPIKey: any = process.env.COMMON_API_SECRET

const commonAuth = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const apiKey = req.header('Common-API-Key')
		if (apiKey === commonAPIKey) return next()

		const session = await FrontEndSession.findOne({ apiKey })
		if (!session) throw new Error("Invalid Key");

		// If session is over it's expiry date (unexpected error case)
		if (new Date().getTime() > new Date(session.expireAt).getTime()) throw new Error("Expired Key");
		else next()
	} catch (error) {
		return errorJson(res, 401, "Invalid Common-API-Key")
	}
}
export default commonAuth