import { errorJson } from "../middleware/errors";
import { Response, createAPIRequest, getAPIRequest } from "./controllerTypes";
import API from "../models/API";
import { apiFiltersList, newsTypeList } from "../models/_types";
import { getLimitSkipSort } from "../helpers/SpecialCtrl";
import { v4 } from "uuid";

// Sends post request to create new api
export const createAPI = async (req: createAPIRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const reporter = req.reporter

		// Validate request body
		const { plan, name, webhookURL, deliveryMethod, filters } = req.body
		if (![name, webhookURL, deliveryMethod].every(x => typeof x === "string")) throw new Error("Invalid request body")
		if (!["websocket", "webhook"].includes(deliveryMethod ?? "")) throw new Error("Invalid request body: delivery method")
		if (!Array.isArray(filters)) throw new Error("Invalid request body: filters is an array")
		if (!filters.every(x => typeof x === "string")) throw new Error("Invalid request body: filters is a list of strings")
		if (!filters.every(x => apiFiltersList.includes(x as any))) throw new Error("Invalid request body: filters")


		// Create unsaved instance of api
		const api = new API({ owner: reporter, plan: "free", name, webhookURL, deliveryMethod, filters, apiKey: v4() })
		await api.validate()

		await api.save()
		res.status(201).send(api)
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get reporter apis
export const filterAPIs = async (req: getAPIRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const reporter = req.reporter

		// Validate request body
		const { limit, skip, sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)

		// Run mongodb query
		const apis = await API.find({ owner: reporter._id }).limit(limit).skip(skip).sort(sort)
		const count = await API.find({ owner: reporter._id }).count()

		res.send({ message: "success", count, data: apis })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get all apis
export const filterAllAPIs = async (req: getAPIRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { limit, skip, sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)

		// Run mongodb query
		const apis = await API.find({}).limit(limit).skip(skip).sort(sort)
		const count = await API.find({}).count()

		res.send({ message: "success", count, data: apis })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}
