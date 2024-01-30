import { Request, Response } from "./controllerTypes"
import { errorJson } from "../middleware/errors"
import { getApiJson, getApiJsonWithHeaders } from "../helpers/APICtrl"
import { v4 } from "uuid"

const solSwipeAPIKey = (process.env.SOLSWIPE_API_KEY as string)
const solSniperRoot = "https://q911c3yhyc.execute-api.us-east-1.amazonaws.com/prod/v1"

// Sends get request to get all collecton names
export const getCollectionNames = async (req: Request, res: Response) => {
	try {
		const headersList = {
			'Content-type': 'application/json',
			"X-API-KEY": solSwipeAPIKey
		}

		const extServerData1 = await getApiJsonWithHeaders(`${solSniperRoot}/top_collections?limit=12&pageNumber=1&order=DESC&sortKey=volume:oneHour`, headersList)
		const extServerData2 = await getApiJsonWithHeaders(`${solSniperRoot}/top_collections?limit=12&pageNumber=2&order=DESC&sortKey=volume:oneHour`, headersList)
		const extServerData3 = await getApiJsonWithHeaders(`${solSniperRoot}/top_collections?limit=12&pageNumber=3&order=DESC&sortKey=volume:oneHour`, headersList)
		if (extServerData1.error || extServerData2.error || extServerData3.error) throw new Error("Solswiper API Error: " + extServerData1.error)
		if (!Array.isArray(extServerData1.items)) throw new Error("Invalid data - Not an array")
		if (!Array.isArray(extServerData2.items)) throw new Error("Invalid data - Not an array")
		if (!Array.isArray(extServerData3.items)) throw new Error("Invalid data - Not an array")

		const allData = [...extServerData1.items, ...extServerData2.items, ...extServerData3.items]

		const data = Array(allData.length)
		for (let i = 0; i < allData.length; i++) {
			const { collection: symbol, name } = allData[i];
			const _id = v4()

			data[i] = { _id, symbol, name }
		}

		res.status(201).send({ message: "success", data })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}
