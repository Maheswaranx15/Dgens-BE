import { v4 } from "uuid"
import { Request, Response, collectionHistoryGraphDataType, getCollectionsListRequest, getHistoryGraphRequest } from "../controllers/controllerTypes"
import { getApiJsonWithHeaders } from "../helpers/APICtrl"
import { errorJson } from "../middleware/errors"
import { format } from "date-fns"
import Report from "../models/Report"

const solSwipeAPIKey = (process.env.SOLSWIPE_API_KEY as string)
const solSniperRoot = "https://q911c3yhyc.execute-api.us-east-1.amazonaws.com/prod/v1"

// Sends get request to get price impact list
export const getCollectionsList = async (req: getCollectionsListRequest, res: Response) => {

	try {
		let page = parseInt(req.query.page ?? "")
		page = isNaN(page) ? 1 : page
		page = page < 1 ? 1 : page

		const headersList = {
			'Content-type': 'application/json',
			"X-API-KEY": solSwipeAPIKey
		}

		const extServerData = await getApiJsonWithHeaders(`${solSniperRoot}/top_collections?limit=12&pageNumber=${page}&order=DESC&sortKey=volume:oneHour`, headersList)
		extServerData.totalPageCount = 750
		if (extServerData.error) throw new Error("Solswiper API Error: " + extServerData.error)
		if (!extServerData.totalPageCount) throw new Error("Solswiper API Error: " + extServerData.error)
		if (!Array.isArray(extServerData.items)) throw new Error("Invalid data - Not an array")

		const allData = extServerData.items

		const data = Array(allData.length)
		for (let i = 0; i < allData.length; i++) {
			const { collection, floorprice, name, image, } = allData[i];
			const _id = v4()
			const symbol = collection
			const floorPrice = floorprice
			const extra = ""

			data[i] = { _id, symbol, name, image, floorPrice, extra }
		}

		const count = data.length
		res.send({ message: "success", data, count, totalPageCount: extServerData.totalPageCount })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to get listings and floor price history
export const getHistoryGraph = async (req: getHistoryGraphRequest, res: Response) => {

	try {
		const { symbol, fromTime, toTime } = req.body
		if (typeof symbol !== "string") throw new Error("Invalid body: symbol")
		if (typeof fromTime !== "number") throw new Error("Invalid body: fromTime")
		if (typeof toTime !== "number") throw new Error("Invalid body: toTime")

		const data: collectionHistoryGraphDataType = {
			name: "", symbol,
			floorPrice: [],
			listings: [],
		}

		const headersList = {
			'Content-type': 'application/json',
			"X-API-KEY": solSwipeAPIKey
		}

		const extCollServerData = await getApiJsonWithHeaders(`${solSniperRoot}/collections/${symbol}`, headersList)
		if (extCollServerData.error) throw new Error("Solswiper API Error at collection info stage: " + extCollServerData.error)
		data.name = extCollServerData.name

		const granularity = (Math.abs(toTime - fromTime) >= (1000 * 60 * 60 * 24 * 10)) ? "DAILY" : "HOURLY" // use daily for more than 10 days
		const extListingServerData = await getApiJsonWithHeaders(`${solSniperRoot}/collections/${symbol}/listings_chart?fromTime=${fromTime}&toTime=${toTime}&granularity=${granularity}`, headersList)
		if (extListingServerData.error) throw new Error("Solswiper API Error at collection listings stage: " + extListingServerData.error)

		const extFloorServerData = await getApiJsonWithHeaders(`${solSniperRoot}/collections/${symbol}/floors_chart?fromTime=${fromTime}&toTime=${toTime}&granularity=${granularity}`, headersList)
		if (extFloorServerData.error) throw new Error("Solswiper API Error at collection floor price stage: " + extFloorServerData.error)

		const news = await Report.find({
			status: "published",
			publishedOn: {
				$lte: new Date(toTime),
				$gte: new Date(fromTime),
			},
			collectionName: data.name
		}).sort({ publishedOn: -1 }).select(["image", "headline", "urgency", "publishedOn"]).lean()

		for (let i = 0; i < extFloorServerData.t.length; i++) {
			const timestamp = extFloorServerData.t[i];
			const futurestamp = extFloorServerData.t[i + 1] ?? toTime;
			const floorPrice = extFloorServerData.c[i];

			if (timestamp > fromTime && timestamp < toTime) {
				const newsLength = news.length
				let pointData = undefined
				for (let j = 0; j < newsLength; j++) {
					const report = news[newsLength - 1 - j];
					if (!report.publishedOn) continue
					const publishedDate = new Date(report.publishedOn).getTime()
					if (publishedDate < fromTime) { news.pop(); continue }
					if (publishedDate < timestamp) { news.pop(); continue }
					if (publishedDate >= timestamp && publishedDate <= futurestamp) {
						pointData = {
							_id: report._id as string,
							category: report.urgency,
							headline: report.headline,
							image: report.image ?? ""
						};
						news.pop(); continue
					}
					if (publishedDate > timestamp) { break }
				}

				data.floorPrice.push({
					label: granularity,
					value: floorPrice, point: pointData !== undefined, pointData, timestamp
				})
			}
		}

		for (let i = 0; i < extListingServerData.t.length; i++) {
			const timestamp = extListingServerData.t[i];
			const floorPrice = extListingServerData.l[i];

			if (timestamp > fromTime && timestamp < toTime) {

				data.listings.push({
					label: granularity,
					value: floorPrice, timestamp
				})
			}
		}

		res.send({ message: "success", data })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}
