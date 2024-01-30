import { errorJson } from "../middleware/errors";
import { Request, Response, createBannerRequest } from "./controllerTypes";
import Banner from "../models/Banner";
import Report from "../models/Report";
import { subDays } from "date-fns";

const generateBanner = async (name: string) => {
	let banner = await Banner.findOne({ name })
	if (!banner) banner = new Banner({ name, data: [] })
	return banner
}

// Sends post request to create new banner
export const setBanner = async (req: createBannerRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { top, bottom } = req.body
		if (!top && !bottom) throw new Error("Invalid request body: top, bottom")
		if (!Array.isArray(top)) throw new Error("Invalid request body: top is an array")
		if (!Array.isArray(bottom)) throw new Error("Invalid request body: bottom is an array")

		// Create unsaved instance of banner
		const topBanner = await generateBanner("top")
		const bottomBanner = await generateBanner("bottom")

		topBanner.data = top.map(bd => ({ text: bd?.text ?? "", markup: bd?.markup ?? "" }))
		bottomBanner.data = bottom.map(bd => ({ text: bd?.text ?? "", markup: bd?.markup ?? "" }))

		await topBanner.save()
		await bottomBanner.save()
		res.status(201).send({ topBanner, bottomBanner })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get reporter banners
export const getBanners = async (req: Request, res: Response) => {
	try {
		const banners = await Banner.find({ $or: [{ name: "top" }, { name: "bottom" }] })
		const breaking = await Report.find({
			status: "published", "headline.text": { $regex: /^breaking/i },
			publishedOn: {
				$gte: subDays(new Date(), 30),
			}
		}, { "headline": 1 }).lean()
		// breaking
		res.send({
			message: "success", data: {
				top: banners.find(x => x.name == "top"),
				bottom: banners.find(x => x.name == "bottom"),
				breaking: breaking.map(x => ({ _id: x._id, text: x.headline.text, markup: x.headline.markup }))
			}
		})
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}