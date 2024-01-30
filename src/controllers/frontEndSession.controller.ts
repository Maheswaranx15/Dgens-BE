import { v4 } from "uuid"
import FrontEndSession from "../models/FrontEndSession"
import { Request, Response } from "./controllerTypes"
import { errorJson } from "../middleware/errors"
import { addHours, addSeconds } from "date-fns"
import Visit from "../models/Visit"

const commonAPIKey: any = process.env.COMMON_API_SECRET

// Sends post request to create new front end session
export const createFrontEndSession = async (req: Request, res: Response) => {
	try {
		const apiKey = req.body?.apiKey
		if (apiKey !== commonAPIKey) throw new Error("Invalid apiKey")

		await Visit.create({ name: "site" })
		const prevKey = req.body?.prevKey
		if (typeof prevKey === "string" && prevKey?.length > 1) await FrontEndSession.findOneAndDelete({ apiKey: prevKey })

		const newSession = await FrontEndSession.create({ apiKey: v4(), expireAt: addHours(new Date(), 6) })
		res.status(201).send(newSession)
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}
