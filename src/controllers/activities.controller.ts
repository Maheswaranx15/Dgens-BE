import { getLimitSkipSort } from "../helpers/SpecialCtrl"
import { errorJson } from "../middleware/errors"
import Activity from "../models/Activity"
import { sendNewActivity } from "../my-socket/emitter"
import { IReporterInstance } from "../models/_types"
import { Response, createActivityType, getActivityRequest } from "./controllerTypes"

export const createActivity: createActivityType = async (reporter, description) => {
	try {
		const act = await Activity.create({ reporter, description })
		if (act) {
			sendNewActivity(act, reporter)
			return { status: "success" }
		}
		else return { status: "failure" }
	} catch (error) { return { status: "failure" } }
}

export const filterActivities = async (req: getActivityRequest, res: Response) => {

	try {
		const { limit, skip, sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)
		const acts = await Activity.find().limit(limit).skip(skip).sort(sort).populate("reporter", "username role twitter avatar")
		const count = await Activity.find().count()
		const activities = acts.map(act => {
			const { followers, following } = { followers: 4, following: 6 }
			return {
				_id: act._id,
				username: (act.reporter as unknown as IReporterInstance)?.username,
				avatar: (act.reporter as unknown as IReporterInstance)?.avatar,
				description: act.description,
				followers, following,
				reporter: (act.reporter as unknown as IReporterInstance)?.role,
				createdAt: act.createdAt
			}
		})

		res.send({
			message: "success", count,
			data: activities
		})
	} catch (e) {
		return errorJson(res, 500, String(e))
	}
}