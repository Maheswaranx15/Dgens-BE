import { errorJson } from "../middleware/errors";
import { Request, Response, createReportRequest, disputeReportRequest, getOneReportRequest, getReportNewsRequest, getReportRequest, seniorValidateReportRequest, setBreakingReportRequest, tipReportRequest } from "./controllerTypes";
import Report from "../models/Report";
import { dataUri } from "../helpers/multer";
import { uploader } from "../helpers/cloudinary";
import { IReportInstance, newsTypeList, urgencyTypeList } from "../models/_types";
import Counter from "../models/Counter";
import { addMinutes } from "date-fns";
import { createActivity } from "./activities.controller";
import Reporter from "../models/Reporter";
import { dateIsValid, getLimitSkipSort, zeroDateTime } from "../helpers/SpecialCtrl";

import CONFIG from "../config"
const { FIXED_SOL } = CONFIG

// function that saves report image
const saveReportImage = async (req: any, report: IReportInstance, save = false) => {
	if (!report) throw new Error('Invalid Report')

	const image = dataUri(req, "djhsdf");

	if (!image) throw new Error('Invalid Image - datauri')

	try {
		const cloudImage = await uploader.upload(image, {
			folder: 'degen-news/report-image',
			public_id: report._id.toString(),
			invalidate: true,
		})
		if (cloudImage?.secure_url) {
			const imageURL = cloudImage.secure_url
			if (save) { report.image = imageURL; await report.save() }
			return imageURL
		} else throw new Error("Image issues")
	} catch (error) {
		console.log('cloud error', error)
		throw new Error("Image issues")
	}
}
const reportDefaultImage = (process.env.DEFAULT_REPORT_IMAGE as string)

// Sends post request to create new report
export const createReport = async (req: createReportRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	// if (!req.file) return errorJson(res, 400, "No Image Sent")

	try {
		const reporter = req.reporter

		// Validate request body
		const { reportId, reporterWalletAddress, description, headlineMarkup, headlineText, newsType, source, urgency, magicEden, collectionName, twitter } = req.body

		if (![newsType, source, urgency, headlineMarkup, headlineText].every(x => typeof x === "string")) throw new Error("Invalid request body")
		if (!newsTypeList.includes(newsType as any)) throw new Error("Invalid request body: news type")
		if (!urgencyTypeList.includes(urgency as any)) throw new Error("Invalid request body: urgency type")
		if (!req.file) throw new Error("Invalid request file: image")
		// Create unsaved instance of report
		const report = new Report({
			reportId, reporterWalletAddress, headline: { markup: headlineMarkup, text: headlineText }, newsType, source, urgency, author: req.reporter,
			views: [], revenue: { tips: [], rewards: [] }
		})

		if (magicEden && typeof magicEden === "string") report.magicEden = magicEden
		if (description && typeof description === "string") report.description = description
		if (collectionName && typeof collectionName === "string") report.collectionName = collectionName
		if (twitter && typeof twitter === "string") report.twitter = twitter

		// Assign report status, curator and publisher based on reporter role
		if (reporter.role === "admin") {
			report.curator = req.reporter._id;
			report.acceptedOn = new Date()
			report.status = "accepted"
		} else if (reporter.role === "senior") {
			report.curator = req.reporter._id;
			report.acceptedOn = new Date()
			report.status = "accepted"
		} else if (reporter.role === "junior") {
			report.status = "pending"
		} else report.status = "rejected"

		// Generate report hash based on the counter model
		report.reportHash = await Counter.generateNextCount("report")
		await report.validate()


		// Save report image if available
		report.image = await saveReportImage(req, report)

		await report.save()

		await createActivity(reporter._id, `created a new report.`)

		res.status(201).send(report)
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends patch request to edit report
export const editReport = async (req: createReportRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const reporter = req.reporter

		// Validate request body
		const { description, headlineMarkup, headlineText, newsType, source, urgency, _id, collectionName, magicEden, twitter } = req.body
		if (![newsType, source, urgency, headlineMarkup, headlineText, _id].every(x => typeof x === "string")) throw new Error("Invalid request body")
		if (!newsTypeList.includes(newsType as any)) throw new Error("Invalid request body: news type")
		if (!urgencyTypeList.includes(urgency as any)) throw new Error("Invalid request body: urgency type")

		// Find the desired report and confirm ownership
		const report = await Report.findOne({ author: reporter._id, _id, status: { $ne: "published" } })
		if (!report) throw new Error("Report does not exist")

		if (reporter.role === "junior" && (new Date().getTime() > addMinutes(report.createdAt, 5).getTime())) throw new Error("Report has exceeded 5mins grace")
		if (reporter.role === "senior" && (report.status === "published")) throw new Error("Report has been published")
		if (reporter.role !== "junior" && reporter.role !== "admin" && reporter.role !== "senior") throw new Error("You do not have access")

		report.headline = { markup: headlineMarkup ?? "", text: headlineText ?? "" }
		report.source = source ?? ""
		report.newsType = newsType as any
		report.urgency = urgency as any
		if (magicEden && typeof magicEden === "string") report.magicEden = magicEden
		if (description && typeof description === "string") report.description = description
		if (collectionName && typeof collectionName === "string") report.collectionName = collectionName
		if (twitter && typeof twitter === "string") report.twitter = twitter

		// Save report image if changed
		if (req.file) report.image = await saveReportImage(req, report)

		await report.save()
		res.send(report)
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to place a report on the breaking news bar
export const getBreakingReport = async (req: Request, res: Response) => {

	try {
		const main = await Report.find({ breaking: "top" }).select(["urgency", "headline"]).lean()
		const sub = await Report.find({ breaking: "bottom" }).select(["headline"]).lean()

		res.send({ message: "success", data: { main, sub } })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to place a report on the breaking news bar
export const setBreakingReport = async (req: setBreakingReportRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { _id, breaking } = req.body
		if (typeof _id !== "string") throw new Error("Invalid request body: _id")


		if (breaking === "top" || breaking === "bottom") {
			// Find the desired report and confirm status
			const report = await Report.findOneAndUpdate({ _id, status: "published" }, { $set: { breaking } })
			if (!report) throw new Error("Report does not exist")
		} else {
			// Find the desired report and confirm status
			const report = await Report.findOneAndUpdate({ _id, status: "published" }, { $unset: { breaking: "" } })
			if (!report) throw new Error("Report does not exist")
		}

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to make a dispute
export const juniorDisputeReport = async (req: disputeReportRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { _id } = req.body
		if (typeof _id !== "string") throw new Error("Invalid request body: _id")

		// Find the desired report and confirm ownership
		const report = await Report.findOneAndUpdate({ _id, status: "rejected", author: req.reporter._id }, { $set: { dispute: true } })
		if (!report) throw new Error("Report does not exist")

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to approve or reject report
export const seniorValidateReport = async (req: seniorValidateReportRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { status, _id, reason, description, headlineMarkup, headlineText, newsType, source, urgency, magicEden, collectionName, twitter } = req.body
		if (typeof _id !== "string") throw new Error("Invalid request body: _id")
		if (!(status === "accepted" || status === "rejected")) throw new Error("Invalid request body: status")

		// Find the desired report and confirm ownership
		if (status === "accepted") {
			const report = await Report.findOne({ _id, status: "pending" })
			if (!report) throw new Error("Report does not exist")

			if (magicEden && typeof magicEden === "string") report.magicEden = magicEden
			if (description && typeof description === "string") report.description = description
			if (collectionName && typeof collectionName === "string") report.collectionName = collectionName
			if (twitter && typeof twitter === "string") report.twitter = twitter
			if (typeof headlineMarkup === "string" && typeof headlineText === "string") report.headline = { markup: headlineMarkup, text: headlineText }
			if (newsType && newsTypeList.includes(newsType as any)) report.newsType = (newsType as any)
			if (urgency && urgencyTypeList.includes(urgency as any)) report.urgency = (urgency as any)
			if (source && typeof source === "string") report.source = source
			if (req.file) report.image = await saveReportImage(req, report)

			report.status = status
			report.acceptedOn = new Date()
			report.curator = req.reporter._id

			await report.save()

			// save activity
			const author = await Reporter.findById(report.author)
			if (!author) throw new Error("Author does not exist")
			await createActivity(req.reporter._id, `accepted @${author?.username} report.`)
		} else if (status === "rejected") {
			if (typeof reason !== "string") throw new Error("Invalid request body: reason")
			const report = await Report.findOneAndUpdate({ _id, status: "pending" }, { $set: { status: status, rejectedOn: new Date(), reason, curator: req.reporter } })
			if (!report) throw new Error("Report does not exist")

			// save activity
			const author = await Reporter.findById(report.author)
			if (!author) throw new Error("Author does not exist")
			await createActivity(req.reporter._id, `rejected @${author?.username} report.`)
		}

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to reject report
export const adminRejectReport = async (req: seniorValidateReportRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { _id, reason } = req.body
		if (typeof _id !== "string") throw new Error("Invalid request body: _id")
		if (typeof reason !== "string") throw new Error("Invalid request body: reason")

		// Find the desired report and confirm ownership
		const report = await Report.findOneAndUpdate({ _id, status: { $in: ["accepted", "published"] } }, { $set: { status: "rejected", rejectedOn: new Date(), reason, curator: req.reporter } })
		if (!report) throw new Error("Report does not exist")

		// save activity
		const author = await Reporter.findById(report.author)
		if (!author) throw new Error("Author does not exist")
		await createActivity(req.reporter._id, `rejected @${author?.username} report.`)

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to publish report
export const adminPublishReport = async (req: seniorValidateReportRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { _id, description, headlineMarkup, headlineText, newsType, source, urgency, magicEden, collectionName, twitter } = req.body

		if (!(description && typeof description === "string")) throw new Error("Invalid req body: 'description'")
		// if (!(collectionName && typeof collectionName === "string")) throw new Error("Invalid req body: 'collectionName'")
		if (!(typeof headlineMarkup === "string" && typeof headlineText === "string")) throw new Error("Invalid req body: 'headline'")
		if (!(newsType && newsTypeList.includes(newsType as any))) throw new Error("Invalid req body: 'newsType'")
		if (!(urgency && urgencyTypeList.includes(urgency as any))) throw new Error("Invalid req body: 'urgency'")
		if (!(source && typeof source === "string")) throw new Error("Invalid req body: 'source'")
		if (typeof _id !== "string") throw new Error("Invalid request body: _id")

		// Find the desired report 
		const report = await Report.findOne({ _id, status: "accepted" })
		if (!report) throw new Error("Report does not exist")

		if (req.file) report.image = await saveReportImage(req, report)
		if (!report.image) throw new Error("Invalid req body: 'image'")
		if (magicEden && typeof magicEden === "string") report.magicEden = magicEden
		if (twitter && typeof twitter === "string") report.twitter = twitter
		if (collectionName && typeof collectionName === "string") report.collectionName = collectionName

		report.description = description
		report.collectionName = collectionName
		// report.twitter = twitter
		report.headline = { markup: headlineMarkup, text: headlineText }
		report.newsType = (newsType as any)
		report.urgency = (urgency as any)
		report.source = source

		report.status = "published"
		report.publishedOn = new Date()
		report.publisher = req.reporter._id
		report.revenue.rewards = [{ amount: FIXED_SOL, pending: true, createdAt: new Date() }]

		await report.save()

		// save activity
		const author = await Reporter.findById(report.author)
		if (!author) throw new Error("Author does not exist")
		await createActivity(req.reporter._id, `published @${author?.username} report.`)

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

export const adminPublishAllReport = async (req: any, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		// Validate request body
		const { newsList, signature } = req.body
		await newsList.map(async (item: any, index: number) => {
			const report = {
				...item,
				status: "published",
				publishedOn: new Date(),
				publisher: req.reporter._id,
				signature: signature,
				revenue: {
					rewards: [{ amount: FIXED_SOL, pending: true, createdAt: new Date() }]
				}
			}

			const res = await Report.findOneAndUpdate({ reportId: report.reportId }, report)

			// save activity
			const author = await Reporter.findById(report.author)
			if (!author) throw new Error("Author does not exist")
			await createActivity(req.reporter._id, `published @${author?.username} report.`)
		})

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to tip a report
export const tipReport = async (req: tipReportRequest, res: Response) => {

	try {
		// Validate request body
		const { _id, amount, secretWeb3PinToVerify } = req.body

		if (typeof _id !== "string") throw new Error("Invalid request body: _id")
		if (typeof amount !== "number") throw new Error("Invalid request body: number")
		if (isNaN(amount)) throw new Error("Invalid request body: number")
		if (typeof secretWeb3PinToVerify !== "string") throw new Error("Invalid request body: secretWeb3PinToVerify")

		// web3 work
		// markal this is for you, verify the secretWeb3PinToVerify

		// Find and update the desired report 
		const report = await Report.findByIdAndUpdate(_id, {
			$push: { "revenue.tips": { amount } }
		}, { new: false }).select(["_id"]).lean()
		if (!report) throw new Error("Report does not exist")

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to tip a report
export const mintReport = async (req: any, res: Response) => {

	try {
		// Validate request body
		const { _id, mint, secretWeb3PinToVerify } = req.body

		if (typeof secretWeb3PinToVerify !== "string") throw new Error("Invalid request body: secretWeb3PinToVerify")

		// web3 work
		// markal this is for you, verify the secretWeb3PinToVerify

		// Find and update the desired report 
		const report = await Report.findByIdAndUpdate(_id, {
			$push: { "mint": mint }
		}, { new: false }).select(["_id"]).lean()
		if (!report) throw new Error("Report does not exist")

		res.send({ message: "success" })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get reports
export const filterReports = async (req: getReportRequest, res: Response) => {

	try {
		// Validate request body
		const { status, author, curator, newsType, urgency, creationFrameEnd, creationFrameStart, collectionName, text, reportNumber } = req.query
		const { limit, skip, sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)

		if (status) if (!(status === "accepted" || status === "rejected" || status === "pending" || status === "published" || status === "admin")) throw new Error("Invalid request body: status")
		if (newsType) if (!newsTypeList.includes(newsType as any)) throw new Error("Invalid request body: news type")
		if (urgency) if (!urgencyTypeList.includes(urgency as any)) throw new Error("Invalid request body: urgency type")
		if (author) if (typeof author !== "string") throw new Error("Invalid request body: author")
		if (curator) if (typeof curator !== "string") throw new Error("Invalid request body: curator")
		let textSort: any = undefined

		// Assemble filter data query
		type filterDataType = { status?: string, newsType?: string, urgency?: string, author?: string, curator?: string, createdAt?: any, $or?: any, collectionName?: string, $text?: any, reportHash?: any }
		const filterData: filterDataType = {}
		if (status) if (status === "admin") { filterData.$or = [{ status: "published" }, { status: "accepted" }] } else { filterData.status = status }
		if (newsType) filterData.newsType = newsType
		if (urgency) filterData.urgency = urgency
		if (author) filterData.author = author
		if (collectionName) filterData.collectionName = collectionName
		if (curator) filterData.curator = curator
		if (reportNumber) filterData.reportHash = { $regex: new RegExp('^' + reportNumber) }
		if (creationFrameEnd && creationFrameStart) {
			if (!dateIsValid(new Date(creationFrameStart))) throw new Error("Invalid date start")
			if (!dateIsValid(new Date(creationFrameEnd))) throw new Error("Invalid date end")

			filterData.createdAt = {
				$lte: zeroDateTime(new Date(creationFrameEnd), "end"),
				$gte: zeroDateTime(new Date(creationFrameStart), "start"),
			}
		}
		if (text) {
			filterData.$text = { $search: text }
			textSort = { score: { $meta: 'textScore' } }
		}

		// Run mongodb query
		const reports = await Report.find(filterData).limit(limit).skip(skip).sort(textSort ?? sort).populate("author", "username").populate("curator", "username")
		const count = await Report.find(filterData).count()

		res.send({ message: "success", count, data: reports })
	} catch (error) {
		console.log(error)
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to get published reports
export const filterNews = async (req: getReportNewsRequest, res: Response) => {

	try {
		// Validate request body
		const { newsType, urgency, creationFrameEnd, creationFrameStart, text, collectionName, specialID } = req.query
		const { limit, skip, sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)
		let textSort: any = undefined

		if (newsType) if (!newsTypeList.includes(newsType as any)) throw new Error("Invalid request body: news type")
		if (urgency) if (!urgencyTypeList.includes(urgency as any)) throw new Error("Invalid request body: urgency type")

		// Assemble filter data query
		type filterDataType = { newsType?: string, urgency?: string, status: string, publishedOn?: any, $text?: any, collectionName?: string, mint?: any }
		const filterData: filterDataType = { status: "published" }
		if (newsType) filterData.newsType = newsType
		if (urgency) filterData.urgency = urgency
		if (collectionName) filterData.collectionName = collectionName
		if (creationFrameEnd && creationFrameStart) {
			if (!dateIsValid(new Date(creationFrameStart))) throw new Error("Invalid date start")
			if (!dateIsValid(new Date(creationFrameEnd))) throw new Error("Invalid date end")

			filterData.publishedOn = {
				$lte: zeroDateTime(new Date(creationFrameEnd), "end"),
				$gte: zeroDateTime(new Date(creationFrameStart), "start"),
			}
		}
		if (text) {
			filterData.$text = { $search: text }
			textSort = { score: { $meta: 'textScore' } }
		}

		filterData.mint = { $eq: null }

		// Run mongodb query
		// const reports = await Report.find(filterData).limit(limit).skip(skip).sort(sort)
		const reports = await Report.find(filterData).limit(limit).skip(skip).sort(textSort ?? sort).select(["image", "source", "twitter", "magicEden", "headline", "description", "urgency", "newsType", "author", "collectionName", "twitter", "reportHash"])

		const count = await Report.find(filterData).count()

		await Report.updateMany({ _id: { $in: reports.map(x => x._id) } }, {
			$push: { views: {} }
		})

		let allReports: any[] = reports
		if (specialID && specialID.length > 2) {
			try {
				const report = await Report.findOne({ status: "published", _id: specialID }).select(["image", "source", "twitter", "magicEden", "headline", "description", "urgency", "newsType", "author", "collectionName", "twitter", "reportHash"])
				if (!report) throw new Error()
				allReports = [{ ...report.toJSON(), st: true }, ...reports]
			} catch (error) { }
		}

		res.send({ message: "success", count, data: allReports })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends get request to a report
export const getReport = async (req: getOneReportRequest, res: Response) => {

	try {
		// Validate request body
		const { _id } = req.query
		if (!_id) throw new Error("Invalid request body: _id")
		const report = await Report.findById(_id)

		res.send({ message: "success", data: report })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}
