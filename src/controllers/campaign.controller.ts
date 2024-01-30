import { errorJson } from "../middleware/errors";
import { Response, adminUpdateCampaignStatusRequest, authReporterRequest, campaignDashboardDataType, campaignDashboardRequest, createCampaignRequest, getCampaignAdsRequest, getCampaignRequest, getOneCampaignRequest, impressAdsRequest, rCampaignDashboardDataType } from "./controllerTypes";
import Campaign from "../models/Campaign";
import { dataUriMulti } from "../helpers/multer";
import { uploader } from "../helpers/cloudinary";
import { ICampaignInstance, adTypeList } from "../models/_types";
import Counter from "../models/Counter";
import { dateIsValid, getLimitSkipSort, zeroDateTime } from "../helpers/SpecialCtrl";
import isURL from "validator/lib/isURL";
import { generateDayRange, generateDayRange3Steps, generateMonthRange, generateWeekRange, getDayLetterNumbers, getDayLetters, getLastDays, getLastDays3Steps, getLastMonth, getLastWeek, getMonthLetters } from "../helpers/TimeCtrl";
import { subDays } from "date-fns";

// function that saves campaign image
const saveCampaignImage = async (req: any, campaign: ICampaignInstance, save = false) => {
	if (!campaign) throw new Error('Invalid Campaign')

	const desktopImage = dataUriMulti(req, "djhsdf", "desktop");
	if (!desktopImage) throw new Error('Invalid Desktop Image - datauri')

	const mobileImage = dataUriMulti(req, "djhsdf", "mobile");
	if (!mobileImage) throw new Error('Invalid Mobile Image - datauri')

	const cloudDesktopImage = await uploader.upload(desktopImage, {
		folder: `degen-news/campaign-image/desktop`,
		public_id: campaign._id.toString(),
		invalidate: true,
	})

	const cloudMobileImage = await uploader.upload(mobileImage, {
		folder: `degen-news/campaign-image/mobile`,
		public_id: campaign._id.toString(),
		invalidate: true,
	})

	if (cloudDesktopImage?.secure_url && cloudMobileImage?.secure_url) {
		const { desktop, mobile } = { desktop: cloudDesktopImage.secure_url, mobile: cloudMobileImage.secure_url }
		if (save) { campaign.image.desktop = desktop; campaign.image.mobile = mobile; await campaign.save() }
		return { desktop, mobile }
	} else throw new Error("Image issues")
}

// Sends post request to create new campaign
export const createCampaign = async (req: createCampaignRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	if (!req.files) return errorJson(res, 400, "No Image Sent")

	try {
		const reporter = req.reporter

		// Validate request body
		const { campaignId, description, adType, budget, discord, twitter, website, durationEnd, durationStart } = req.body
		const adDuration = { start: new Date(durationStart ?? ""), end: new Date(durationEnd ?? "") }
		if (![description, adType, budget, discord, twitter, website].every(x => typeof x === "string")) throw new Error("Invalid request body")
		if (!adTypeList.includes(adType as any)) throw new Error("Invalid request body: ad type")

		if (isNaN(parseInt(budget ?? ""))) throw new Error("Invalid request body: budjet is a number")
		if (parseFloat(budget ?? "") < 1) throw new Error("Invalid request body: budjet must be greater than one")

		if (!isURL(discord ?? "")) throw new Error("Invalid request body: discord is a url")
		if (!isURL(twitter ?? "")) throw new Error("Invalid request body: twitter is a url")
		if (!isURL(website ?? "")) throw new Error("Invalid request body: website is a url")
		if (!website?.startsWith?.("https://")) throw new Error("Invalid request body: website starts with https://")

		if (isNaN(adDuration.start.valueOf())) throw new Error("Invalid request body: start date")
		if (isNaN(adDuration.end.valueOf())) throw new Error("Invalid request body: end date")

		const newAdDuration = {
			start: zeroDateTime(new Date(adDuration.start), "start"),
			end: zeroDateTime(new Date(adDuration.end), "end")
		}
		if (new Date().getTime() > newAdDuration.start.getTime()) throw new Error("Invalid request body: ads_start_in_the_future")
		if (newAdDuration.start.getTime() >= newAdDuration.end.getTime()) throw new Error("Invalid request body: your_dates_are_backwards")

		const allNotRejectedCampaignsInYourTime = await Campaign.find({
			status: { $nin: ["rejected", "ended"] },
			$or: [
				{
					$and: [ // Catch if the time has the start leg outside and the end le inside
						{ "adDuration.start": { $gte: newAdDuration.start } },
						{ "adDuration.start": { $lte: newAdDuration.end } }
					]
				},
				{
					$and: [ // Catch if the time has the start leg inside and the end le inside
						{ "adDuration.end": { $gte: newAdDuration.start } },
						{ "adDuration.start": { $lte: newAdDuration.start } }
					]
				},
			]
		})

		if (allNotRejectedCampaignsInYourTime.length > 0) throw new Error("your_time_is_taken");

		// Create unsaved instance of campaign
		const campaign = new Campaign({
			campaignId, description, adType, spendings: parseFloat(budget ?? ""), discord, twitter, website,
			owner: reporter, views: [], clicks: [], status: "new", adDuration: newAdDuration
		})

		// Generate campaign hash based on the counter model
		campaign.campaignID = await Counter.generateNextCount("campaign")
		await campaign.validate()

		// Save campaign image
		campaign.image = await saveCampaignImage(req, campaign)

		console.log('================', campaign)

		await campaign.save()
		res.status(201).send(campaign)
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to change campaign status
export const adminUpdateCampaignStatus = async (req: adminUpdateCampaignStatusRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const reporter = req.reporter

		// Validate request body
		const { _id, status } = req.body
		if (typeof _id !== "string") throw new Error("Invalid request body: _id")
		if (!(status === "ended" || status === "rejected" || status === "running" || status === "approved")) throw new Error("Invalid request body: status")

		// Find the desired campaign and confirm ownership
		if (status !== "rejected") {
			const campaign = await Campaign.findOneAndUpdate({ _id, status: { $nin: ["rejected", "ended"] } }, { $set: { status }, $push: { judges: { judge: reporter._id, action: status } } })
			if (!campaign) throw new Error("Campaign does not exist")
		} else {
			const campaign = await Campaign.findOneAndUpdate({ _id, status: "new" }, { $set: { status }, $push: { judges: { judge: reporter._id, action: status } } })
			if (!campaign) throw new Error("Campaign does not exist")
		}

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get campaign
export const getCampaign = async (req: getOneCampaignRequest, res: Response) => {

	try {
		// Validate request body
		const { campaignID } = req.query
		if (isNaN(parseInt(campaignID ?? ""))) throw new Error("Invalid request body: campaignID")

		// Run mongodb query
		const campaign = await Campaign.findOne({ campaignID: parseInt(campaignID ?? "") })
		if (!campaign) throw new Error("Invalid campaignID")

		res.send({ message: "success", data: campaign })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get campaigns
export const filterCampaigns = async (req: getCampaignRequest, res: Response) => {

	try {
		// Validate request body
		const { status, owner, adType, creationFrameEnd, creationFrameStart, adDate } = req.query
		const { limit, skip, sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)

		if (status) if (!(status === "ended" || status === "rejected" || status === "running" || status === "approved" || status === "new")) throw new Error("Invalid request body: status")
		if (adType) if (!adTypeList.includes(adType as any)) throw new Error("Invalid request body: ad type")
		if (owner) if (typeof owner !== "string") throw new Error("Invalid request body: owner")

		// Assemble filter data query
		type filterDataType = { status?: string, adType?: string, owner?: string, curator?: string, "createdAt"?: any, $or?: any }
		const filterData: filterDataType = {}
		if (status) filterData.status = status
		if (adType) filterData.adType = adType
		if (owner) filterData.owner = owner
		if (creationFrameEnd && creationFrameStart) {
			if (!dateIsValid(new Date(creationFrameStart))) throw new Error("Invalid date start")
			if (!dateIsValid(new Date(creationFrameEnd))) throw new Error("Invalid date end")

			if (adDate === "ok") {
				filterData["$or"] = [
					{
						"adDuration.start": {
							$lte: zeroDateTime(new Date(creationFrameEnd), "end"),
							$gte: zeroDateTime(new Date(creationFrameStart), "start"),
						}
					},
					{
						"adDuration.end": {
							$lte: zeroDateTime(new Date(creationFrameEnd), "end"),
							$gte: zeroDateTime(new Date(creationFrameStart), "start"),
						}
					},
				]
			} else {
				filterData["createdAt"] = {
					$lte: zeroDateTime(new Date(creationFrameEnd), "end"),
					$gte: zeroDateTime(new Date(creationFrameStart), "start"),
				}
			}
		}

		// Run mongodb query
		const campaigns = await Campaign.find(filterData).limit(limit).skip(skip).sort(sort)
		const count = await Campaign.find(filterData).count()

		res.send({ message: "success", count, data: campaigns })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get taken campaigns durations
export const takenCampaigns = async (req: getCampaignRequest, res: Response) => {

	try {
		// Validate request body
		const { sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)

		// Assemble filter data query
		const filterData = {
			status: { $nin: ["rejected", "ended"] },
			"adDuration.start": {
				$gte: zeroDateTime(new Date(), "start"),
			}
		}

		// Run mongodb query
		const campaigns = await Campaign.find(filterData).sort(sort).select(["adDuration", "campaignID"]).lean()
		const count = await Campaign.find(filterData).count()

		res.send({ message: "success", count, data: campaigns })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get published campaigns
export const filterAds = async (req: getCampaignAdsRequest, res: Response) => {

	try {
		// Validate request body
		const { adType } = req.query
		if (adType) if (!adTypeList.includes(adType as any)) throw new Error("Invalid request body: ad type")

		// Assemble filter data query
		type filterDataType = { adType?: string, "adDuration.start"?: { $lte: Date; }, "adDuration.end": { $gte: Date; }, status: string }
		const filterData: filterDataType = {
			"adDuration.start": { $lte: new Date() },
			"adDuration.end": { $gte: new Date() },
			status: "running"
		}
		if (adType) filterData.adType = adType

		// Run mongodb query
		const campaigns = await Campaign.findOneAndUpdate(filterData, {
			$push: { views: {} }
		}).select(["image", "adType", "description", "website"])

		res.send({ message: "success", data: campaigns })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get impress the active campaigns
export const impressCampaign = async (req: impressAdsRequest, res: Response) => {

	try {
		// Validate request body
		const { _id } = req.query
		if (typeof _id !== "string") throw new Error("Invalid request body: _id")

		// Assemble filter data query
		const filterData = {
			_id,
			"adDuration.start": { $lte: new Date() },
			"adDuration.end": { $gte: new Date() },
			status: "running"
		}

		// Run mongodb query
		const campaign = await Campaign.findOneAndUpdate(filterData, {
			$push: { impressions: {} }
		}).select(["impressions"])
		if (!campaign) throw new Error("Invalid campaign")

		res.send({ message: "success", data: campaign })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// sends get request to fetch auth reporter dashboard
export const getReporterCampaignDashboardData = async (req: authReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	const dashboardData: rCampaignDashboardDataType = {
		totalViews: {
			count: 0,
			prev: 0,
			change: 0,
			data: []
		},
		totalImpressions: {
			count: 0,
		},
		clickThrough: {
			count: 0,
			prev: 0,
			change: 0,
			data: []
		},
		numberOfVisits: {
			daily: [],
			weekly: [],
			monthly: [],
		},
		overview: {
			views: {
				daily: [],
				weekly: [],
				monthly: [],
			},
			clicks: {
				daily: [],
				weekly: [],
				monthly: [],
			},
			impressions: {
				daily: [],
				weekly: [],
				monthly: [],
			},
		},
	}

	try {
		const reporter = req.reporter
		const campaigns = await Campaign.find({ owner: reporter._id })

		// campaigns loop
		for (let i = 0; i < campaigns.length; i++) {
			const campaign = campaigns[i];

			// For loop to get views
			for (let j = 0; j < campaign.views.length; j++) {
				const view = campaign.views[j];

				// This month views
				if (view.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.totalViews.count += 1
				// Last month views
				if ((view.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (view.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.totalViews.prev += 1
			}

			// For loop to get clicks
			for (let j = 0; j < campaign.clicks.length; j++) {
				const view = campaign.clicks[j];

				// This month clicks
				if (view.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.clickThrough.count += 1
				// Last month clicks
				if ((view.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (view.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.clickThrough.prev += 1
			}

			// For loop to get impressions
			for (let j = 0; j < campaign.impressions.length; j++) {
				const impressions = campaign.impressions[j];

				// This month impressions
				if (impressions.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.totalImpressions.count += 1
			}
		}

		// 30 days loop
		for (let i = 0; i < 30; i++) {
			const dateRange = generateDayRange(getLastDays(new Date(), 29 - i))
			let totalViewsData = 0
			let clickThroughData = 0

			for (let i = 0; i < campaigns.length; i++) {
				const campaign = campaigns[i];
				campaign.views.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) totalViewsData += 1
				})
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) clickThroughData += 1
				})
			}

			dashboardData.totalViews.data.push(totalViewsData)
			dashboardData.clickThrough.data.push(clickThroughData)
		}

		// 7 days loop
		for (let i = 0; i < 7; i++) {
			const dateRange = generateDayRange(getLastDays(new Date(), 6 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0
			let overviewImp = 0

			for (let i = 0; i < campaigns.length; i++) {
				const campaign = campaigns[i];
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
				})
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
				})
				campaign.views.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
				})
				campaign.impressions.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewImp += 1
				})
			}

			dashboardData.numberOfVisits.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: numberOfVisits,
			})

			dashboardData.overview.clicks.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: overviewClicks
			})

			dashboardData.overview.views.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: overviewViews,
			})

			dashboardData.overview.impressions.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: overviewImp,
			})
		}

		// 4 weeks loop
		for (let i = 0; i < 4; i++) {
			const dateRange = generateWeekRange(getLastWeek(new Date(), 3 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0
			let overviewImp = 0

			for (let i = 0; i < campaigns.length; i++) {
				const campaign = campaigns[i];
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
				})
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
				})
				campaign.views.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
				})
				campaign.impressions.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewImp += 1
				})
			}

			dashboardData.numberOfVisits.weekly.push({
				label: `Week ${i + 1}`,
				value: numberOfVisits,
			})

			dashboardData.overview.clicks.weekly.push({
				label: `Week ${i + 1}`,
				value: overviewClicks
			})

			dashboardData.overview.views.weekly.push({
				label: `Week ${i + 1}`,
				value: overviewViews,
			})

			dashboardData.overview.impressions.weekly.push({
				label: `Week ${i + 1}`,
				value: overviewImp,
			})
		}

		// 12 months loop
		for (let i = 0; i < 12; i++) {
			const dateRange = generateMonthRange(getLastMonth(new Date(), 11 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0
			let overviewImp = 0

			for (let i = 0; i < campaigns.length; i++) {
				const campaign = campaigns[i];
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
				})
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
				})
				campaign.views.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
				})
				campaign.impressions.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewImp += 1
				})
			}

			dashboardData.numberOfVisits.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: numberOfVisits,
			})

			dashboardData.overview.clicks.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: overviewClicks
			})

			dashboardData.overview.views.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: overviewViews,
			})

			dashboardData.overview.impressions.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: overviewImp,
			})
		}

		// Finish campaign views
		dashboardData.totalViews.change = parseFloat((((dashboardData.totalViews.count - dashboardData.totalViews.prev) / dashboardData.totalViews.prev) * 100).toFixed(1))
		dashboardData.totalViews.change = isFinite(dashboardData.totalViews.change) ? dashboardData.totalViews.change : 100

		// Finish campaign clicks
		dashboardData.clickThrough.change = parseFloat((((dashboardData.clickThrough.count - dashboardData.clickThrough.prev) / dashboardData.clickThrough.prev) * 100).toFixed(1))
		dashboardData.clickThrough.change = isFinite(dashboardData.clickThrough.change) ? dashboardData.clickThrough.change : 100

		res.status(201).send(dashboardData)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to fetch auth reporter dashboard
export const getCampaignDashboardData = async (req: campaignDashboardRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	const dashboardData: campaignDashboardDataType = {
		adViews: {
			count: 0,
			prev: 0,
			change: 0,
			data: []
		},
		clicks: {
			count: 0,
			prev: 0,
			change: 0,
			data: []
		},
		ctr: {
			count: 0,
			prev: 0,
			change: 0,
			data: []
		},
		impressions: {
			count: 0,
			prev: 0,
			change: 0,
			data: []
		},
		numberOfVisits: {
			daily: [],
			weekly: [],
			monthly: [],
		},
		overview: {
			views: {
				daily: [],
				weekly: [],
				monthly: [],
			},
			clicks: {
				daily: [],
				weekly: [],
				monthly: [],
			},
			impressions: {
				daily: [],
				weekly: [],
				monthly: [],
			},
		},
	}

	try {
		const reporter = req.reporter

		const { campaignID } = req.query
		if (typeof campaignID !== "string") throw new Error("Invalid campaignID")

		let campaign: ICampaignInstance
		if (reporter.role === "admin") campaign = await Campaign.findOne({ campaignID })
		else campaign = await Campaign.findOne({ owner: reporter._id, campaignID })
		if (!campaign) throw new Error("Invalid Campaign")

		// For loop to get views
		for (let j = 0; j < campaign.views.length; j++) {
			const view = campaign.views[j];

			// This month views
			if (view.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.adViews.count += 1
			// Last month views
			if ((view.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (view.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.adViews.prev += 1
		}

		// For loop to get impressions
		for (let j = 0; j < campaign.impressions.length; j++) {
			const impression = campaign.impressions[j];

			// This month impressions
			if (impression.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.impressions.count += 1
			// Last month impressions
			if ((impression.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (impression.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.impressions.prev += 1
		}

		// For loop to get clicks
		for (let j = 0; j < campaign.clicks.length; j++) {
			const view = campaign.clicks[j];

			// This month clicks
			if (view.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.clicks.count += 1
			// Last month clicks
			if ((view.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (view.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.clicks.prev += 1
		}

		// 10 step 3 days loop
		for (let i = 0; i < 10; i++) {
			const dateRange = generateDayRange3Steps(getLastDays3Steps(new Date(), 9 - i))
			let totalViewsData = 0
			let clickThroughData = 0
			let impressionsData = 0

			campaign.views.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) totalViewsData += 1
			})
			campaign.impressions.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) impressionsData += 1
			})
			campaign.clicks.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) clickThroughData += 1
			})

			dashboardData.adViews.data.push({
				label: getDayLetterNumbers(dateRange.end),
				value: totalViewsData
			})
			dashboardData.impressions.data.push({
				label: getDayLetterNumbers(dateRange.end),
				value: impressionsData
			})
			dashboardData.clicks.data.push({
				label: getDayLetterNumbers(dateRange.end),
				value: clickThroughData
			})
		}

		// 7 days loop
		for (let i = 0; i < 7; i++) {
			const dateRange = generateDayRange(getLastDays(new Date(), 6 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0
			let overviewImp = 0

			campaign.clicks.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
			})
			campaign.clicks.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
			})
			campaign.views.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
			})
			campaign.impressions.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewImp += 1
			})

			dashboardData.numberOfVisits.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: numberOfVisits,
			})

			dashboardData.overview.clicks.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: overviewClicks
			})

			dashboardData.overview.views.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: overviewViews,
			})

			dashboardData.overview.impressions.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: overviewImp,
			})
		}

		// 4 weeks loop
		for (let i = 0; i < 4; i++) {
			const dateRange = generateWeekRange(getLastWeek(new Date(), 3 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0
			let overviewImp = 0

			campaign.clicks.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
			})
			campaign.clicks.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
			})
			campaign.views.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
			})
			campaign.impressions.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewImp += 1
			})

			dashboardData.numberOfVisits.weekly.push({
				label: `Week ${i + 1}`,
				value: numberOfVisits,
			})

			dashboardData.overview.clicks.weekly.push({
				label: `Week ${i + 1}`,
				value: overviewClicks
			})

			dashboardData.overview.views.weekly.push({
				label: `Week ${i + 1}`,
				value: overviewViews,
			})

			dashboardData.overview.impressions.weekly.push({
				label: `Week ${i + 1}`,
				value: overviewImp,
			})
		}

		// 12 months loop
		for (let i = 0; i < 12; i++) {
			const dateRange = generateMonthRange(getLastMonth(new Date(), 11 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0
			let overviewImp = 0

			campaign.clicks.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
			})
			campaign.clicks.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
			})
			campaign.views.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
			})
			campaign.impressions.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewImp += 1
			})

			dashboardData.numberOfVisits.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: numberOfVisits,
			})

			dashboardData.overview.clicks.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: overviewClicks
			})

			dashboardData.overview.views.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: overviewViews,
			})

			dashboardData.overview.impressions.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: overviewImp,
			})
		}

		// Finish campaign views
		dashboardData.adViews.change = parseFloat((((dashboardData.adViews.count - dashboardData.adViews.prev) / dashboardData.adViews.prev) * 100).toFixed(1))
		dashboardData.adViews.change = isFinite(dashboardData.adViews.change) ? dashboardData.adViews.change : 100

		// Finish campaign impressions
		dashboardData.impressions.change = parseFloat((((dashboardData.impressions.count - dashboardData.impressions.prev) / dashboardData.impressions.prev) * 100).toFixed(1))
		dashboardData.impressions.change = isFinite(dashboardData.impressions.change) ? dashboardData.impressions.change : 100

		// Finish campaign clicks
		dashboardData.clicks.change = parseFloat((((dashboardData.clicks.count - dashboardData.clicks.prev) / dashboardData.clicks.prev) * 100).toFixed(1))
		dashboardData.clicks.change = isFinite(dashboardData.clicks.change) ? dashboardData.clicks.change : 100

		// Finish campaign ctr
		dashboardData.ctr.count = dashboardData.adViews.count === 0 ? 0 : parseFloat(((dashboardData.clicks.count / dashboardData.adViews.count) * 100).toFixed(1))
		dashboardData.ctr.prev = dashboardData.adViews.prev === 0 ? 0 : parseFloat(((dashboardData.clicks.prev / dashboardData.adViews.prev) * 100).toFixed(1))
		dashboardData.ctr.change = parseFloat((((dashboardData.ctr.count - dashboardData.ctr.prev) / dashboardData.ctr.prev) * 100).toFixed(1))
		dashboardData.ctr.change = isFinite(dashboardData.ctr.change) ? dashboardData.ctr.change : 100
		dashboardData.ctr.data = dashboardData.adViews.data.map((view, i) => ({ label: view.label, value: view.value === 0 ? 0 : parseFloat(((dashboardData.clicks.data[i].value / view.value) * 100).toFixed(1)) }))

		res.status(201).send(dashboardData)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}