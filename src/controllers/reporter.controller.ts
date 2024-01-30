import nacl from "tweetnacl";
import * as anchor from '@project-serum/anchor'
import Reporter from "../models/Reporter"
import { errorJson } from "../middleware/errors";
import { Response, adminDashboardDataType, adminManageReportersDashboardDataType, authReporterRequest, checkReporterRequest, createReporterRequest, dashboardDataType, deleteReporterImageRequest, deleteReporterRequest, editReporterRequest, filterReporterRequest, findReporterRequest, followReporterRequest, loginReporterRequest, logoutReporterRequest, payoutReporterRequest, resetReporterSocialsRequest, saveReporterImageRequest } from "./controllerTypes";
import { uploader } from "../helpers/cloudinary";
import { dataUri } from "../helpers/multer";
import Activity from "../models/Activity";
import { getLimitSkipSort, getWalletBalance, sumDecimals } from "../helpers/SpecialCtrl";
import Report from "../models/Report";
import { subDays } from "date-fns";
import { generateDayRange, generateMonthRange, generateWeekRange, getDayLetters, getLastDays, getLastMonth, getLastWeek, getMonthLetters } from "../helpers/TimeCtrl";
import Campaign from "../models/Campaign";
import Visit from "../models/Visit";
import { PublicKey, Connection, Keypair } from "@solana/web3.js"
import bs58 from "bs58"

import CONFIG from "../config"
import { bs } from "date-fns/locale";
const { OWNER } = CONFIG

const reporterDefaultImage = (process.env.DEFAULT_USER_IMAGE as string)

const verifySignature = async (wallet: string, signature: any) => {
	try {
		const message = `WalletAddr#${wallet}`
		const verified = nacl.sign.detached.verify(new TextEncoder().encode(message), bs58.decode(signature), new anchor.web3.PublicKey(wallet).toBuffer())
		return !!verified;
	}
	catch (err) {
		return false;
	}
}

// Sends post request to create new reporter
export const createReporter = async (req: createReporterRequest, res: Response) => {
	try {

		const wallet = req.body?.wallet

		const vault = new Keypair()
		const encodedKey = bs58.encode(vault.secretKey)

		// const discordID = req.body?.discordID
		// const twitter = req.body?.twitter
		// const username = req.body?.username
		const role = req.body?.role
		if (!(role === "admin" || role === "junior" || role === "senior")) throw new Error("Invalid role")
		if (typeof wallet !== "string") throw new Error("Invalid wallet")

		let reporter = await Reporter.findOne({ wallet, role: "viewer" })
		if (!reporter) reporter = new Reporter({ wallet })

		reporter.vault = encodedKey
		// reporter.discordID = discordID
		reporter.role = role
		// reporter.twitter = twitter
		reporter.username = wallet.slice(0, 8)
		reporter.avatar = reporterDefaultImage

		await reporter.save()
		res.status(201).send(reporter)
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to log reporter in
export const loginReporter = async (req: loginReporterRequest, res: Response) => {

	try {
		const { wallet, signature } = req.body
		if (typeof wallet !== "string") throw new Error("Invalid wallet")
		if (typeof signature !== "string") throw new Error("Invalid signature")

		const vault = new Keypair()
		const encodedKey = bs58.encode(vault.secretKey)

		const verified = await verifySignature(wallet, JSON.parse(signature))
		if (!verified) throw new Error("Invalid signature")

		let reporter = await Reporter.findOne({ wallet })
		if (!reporter) reporter = await Reporter.create({ wallet, vault: encodedKey, role: wallet === OWNER ? "owner" : "junior", username: wallet.slice(0, 8), avatar: reporterDefaultImage })

		if (!["owner", "admin", "senior", "junior"].includes(reporter.role)) {
			reporter.role = "junior";
			reporter.vault = encodedKey
			reporter.username = wallet.slice(0, 8)
			reporter.avatar = reporterDefaultImage
			await reporter.save();
		}

		const token = await reporter.generateAuthToken()
		res.status(201).send({ ...reporter.toJSON(), token })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to log reporter in
export const logoutReporter = async (req: logoutReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	const reporter = req.reporter
	const token = req.token
	try {
		reporter.tokens = reporter.tokens.filter(item => item.token !== token)
		await reporter.save()
		res.status(200).send({ message: 'Logout Successful' })
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to fetch auth reporter
export const getReporter = async (req: authReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	res.send(req.reporter)
}

// sends get request to fetch auth reporter dashboard
export const getReporterDashboardData = async (req: authReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	const dashboardData: dashboardDataType = {
		revenueOvertime: [
		],
		totalReports: {
			value: 0,
			improved: true,
			change: 0,
			prev: 0
		},
		reportViews: {
			value: 0,
			improved: true,
			change: 0,
			prev: 0
		},
		currentRevenue: {
			value: 0,
			improved: true,
			change: 0,
			prev: 0
		},
		platformRevenue: {
			rewards: 0,
			tips: 0,
			total: 0
		},
		reportBreaking: 0,
		reportAcceptance: 0,
		lifetimeReports: 0,
		lifetimeRevenue: 0,
		lifetimeViews: 0,
	}

	try {
		const reporter = req.reporter
		const reports = await Report.find({ author: reporter._id })

		for (let i = 0; i < 12; i++) {
			const dateRange = generateMonthRange(getLastMonth(new Date(), 11 - i))
			let revenue = 0

			for (let i = 0; i < reports.length; i++) {
				const report = reports[i];
				report.revenue.tips.concat(report.revenue.rewards).forEach(x => {
					if ((x.createdAt.getTime() > dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) revenue = sumDecimals([revenue, x.amount])
				})
			}

			dashboardData.revenueOvertime.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: revenue,
			})
		}

		for (let i = 0; i < reports.length; i++) {
			const report = reports[i];

			// Get lifetime views
			dashboardData.lifetimeViews += report.views.length

			// Get lifetime revenue
			report.revenue.tips.forEach(tip => dashboardData.lifetimeRevenue = sumDecimals([dashboardData.lifetimeRevenue, tip.amount]))
			report.revenue.rewards.forEach(reward => dashboardData.lifetimeRevenue = sumDecimals([dashboardData.lifetimeRevenue, reward.amount]))

			// Get platform revenue
			report.revenue.tips.forEach(tip => dashboardData.platformRevenue.tips = sumDecimals([dashboardData.platformRevenue.tips, tip.amount]))
			report.revenue.rewards.forEach(reward => dashboardData.platformRevenue.rewards = sumDecimals([dashboardData.platformRevenue.rewards, reward.amount]))
			report.revenue.tips.concat(report.revenue.rewards).forEach(x => dashboardData.platformRevenue.total = sumDecimals([dashboardData.platformRevenue.total, x.amount]))

			// This month reports
			if (report.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.totalReports.value += 1
			// Last month reports
			if ((report.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (report.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.totalReports.prev += 1

			// For loop to get views
			for (let j = 0; j < report.views.length; j++) {
				const view = report.views[j];

				// This month views
				if (view.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.reportViews.value += 1
				// Last month views
				if ((view.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (view.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.reportViews.prev += 1
			}

			// For loop to get revenue
			for (let j = 0; j < (report.revenue.tips.concat(report.revenue.rewards)).length; j++) {
				const item = (report.revenue.tips.concat(report.revenue.rewards))[j];

				// This month money
				if (item.createdAt.getTime() > subDays(new Date(), 30).getTime()) dashboardData.currentRevenue.value = sumDecimals([dashboardData.currentRevenue.value, item.amount])
				// Last month money
				if ((item.createdAt.getTime() > subDays(new Date(), 60).getTime()) && (item.createdAt.getTime() < subDays(new Date(), 30).getTime())) dashboardData.currentRevenue.prev = sumDecimals([dashboardData.currentRevenue.prev, item.amount])
			}
		}

		// Get lifetime reports
		dashboardData.lifetimeReports = reports.length

		// Get report acceptance
		dashboardData.reportAcceptance = parseFloat(((reports.filter(x => x.status === "published").length / reports.length) * 100).toFixed(1))
		dashboardData.reportAcceptance = isFinite(dashboardData.reportAcceptance) ? dashboardData.reportAcceptance : 100

		// Get report breaking
		dashboardData.reportBreaking = parseFloat(((reports.filter(x => x.newsType === "yes").length / reports.length) * 100).toFixed(1))
		dashboardData.reportBreaking = isFinite(dashboardData.reportBreaking) ? dashboardData.reportBreaking : 100

		// Finish total reports
		if (dashboardData.totalReports.value >= dashboardData.totalReports.prev) dashboardData.totalReports.improved = true;
		dashboardData.totalReports.change = parseFloat((Math.abs((dashboardData.totalReports.value - dashboardData.totalReports.prev) / dashboardData.totalReports.prev) * 100).toFixed(1))
		dashboardData.totalReports.change = isFinite(dashboardData.totalReports.change) ? dashboardData.totalReports.change : 100

		// Finish report views
		if (dashboardData.reportViews.value >= dashboardData.reportViews.prev) dashboardData.reportViews.improved = true;
		dashboardData.reportViews.change = parseFloat((Math.abs((dashboardData.reportViews.value - dashboardData.reportViews.prev) / dashboardData.reportViews.prev) * 100).toFixed(1))
		dashboardData.reportViews.change = isFinite(dashboardData.reportViews.change) ? dashboardData.reportViews.change : 100

		// Finish report revenue
		if (dashboardData.currentRevenue.value >= dashboardData.currentRevenue.prev) dashboardData.currentRevenue.improved = true;
		dashboardData.currentRevenue.change = parseFloat((Math.abs((dashboardData.currentRevenue.value - dashboardData.currentRevenue.prev) / dashboardData.currentRevenue.prev) * 100).toFixed(1))
		dashboardData.currentRevenue.change = isFinite(dashboardData.currentRevenue.change) ? dashboardData.currentRevenue.change : 100

		// Finish report revenue
		if (dashboardData.platformRevenue.tips === dashboardData.platformRevenue.rewards) { dashboardData.platformRevenue.tips = 50; dashboardData.platformRevenue.rewards = 50 }
		else {
			dashboardData.platformRevenue.tips = parseFloat((Math.abs(dashboardData.platformRevenue.tips / dashboardData.platformRevenue.total) * 100).toFixed(1));
			dashboardData.platformRevenue.rewards = parseFloat((Math.abs(dashboardData.platformRevenue.rewards / dashboardData.platformRevenue.total) * 100).toFixed(1))
		}

		res.status(201).send(dashboardData)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to fetch auth admin dashboard
export const getAdminDashboardData = async (req: authReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	const dashboardData: adminDashboardDataType = {
		totalViews: {
			count: 0,
			prev: 0,
			change: 0,
			data: []
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
			}
		},
	}

	try {
		const campaigns = await Campaign.find({})
		const visits = await Visit.find({})

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
				// console.log(dateRange.start)
				// console.log(campaign.views)
				// console.log(dateRange.end)
			}

			// console.log(totalViewsData)
			dashboardData.totalViews.data.push(totalViewsData)
			dashboardData.clickThrough.data.push(clickThroughData)
		}

		// 7 days loop
		for (let i = 0; i < 7; i++) {
			const dateRange = generateDayRange(getLastDays(new Date(), 6 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0

			visits.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
			})
			for (let i = 0; i < campaigns.length; i++) {
				const campaign = campaigns[i];
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
				})
				campaign.views.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
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
		}

		// 4 weeks loop
		for (let i = 0; i < 4; i++) {
			const dateRange = generateWeekRange(getLastWeek(new Date(), 3 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0

			visits.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
			})

			for (let i = 0; i < campaigns.length; i++) {
				const campaign = campaigns[i];
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
				})
				campaign.views.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
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
		}

		// 12 months loop
		for (let i = 0; i < 12; i++) {
			const dateRange = generateMonthRange(getLastMonth(new Date(), 11 - i))
			let numberOfVisits = 0
			let overviewClicks = 0
			let overviewViews = 0

			visits.forEach(x => {
				if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) numberOfVisits += 1
			})

			for (let i = 0; i < campaigns.length; i++) {
				const campaign = campaigns[i];
				campaign.clicks.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewClicks += 1
				})
				campaign.views.forEach(x => {
					if ((x.createdAt.getTime() >= dateRange.start.getTime()) && (x.createdAt.getTime() < dateRange.end.getTime())) overviewViews += 1
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

// sends get request to fetch manage reporters dashboard
export const getManageReportersDashboardData = async (req: authReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	const dashboardData: adminManageReportersDashboardDataType = {
		junior: {
			revenue: 0,
			count: 0,
			payoutDue: 0,
			paidOut: {
				daily: [],
				weekly: [],
				monthly: [],
			}
		},
		walletBalance: 0,
	}

	try {
		const reporters = await Reporter.find({ role: "junior" })
		const allRewards: {
			amount: number
			pending: boolean
			paidOutDate?: Date
			createdAt: NativeDate
		}[] = []

		// reporters loop
		for (let i = 0; i < reporters.length; i++) {
			const reporter = reporters[i];
			const reports = await Report.find({ author: reporter._id })

			// For loop to get reports
			for (let j = 0; j < reports.length; j++) {
				const report = reports[j];

				for (let k = 0; k < report.revenue.rewards.length; k++) {
					const reward = report.revenue.rewards[k];
					allRewards.push(reward)

					dashboardData.junior.revenue = sumDecimals([dashboardData.junior.revenue, reward.amount])
					if (reward.pending) dashboardData.junior.payoutDue = sumDecimals([dashboardData.junior.payoutDue, reward.amount])
				}
			}
		}

		// 7 days loop
		for (let i = 0; i < 7; i++) {
			const dateRange = generateDayRange(getLastDays(new Date(), 6 - i))
			let paidOut = 0

			allRewards.forEach(x => {
				if (x.pending === false && x?.paidOutDate) {
					if ((x.paidOutDate.getTime() >= dateRange.start.getTime()) && (x.paidOutDate.getTime() < dateRange.end.getTime())) paidOut = sumDecimals([paidOut, x.amount])
				}
			})

			dashboardData.junior.paidOut.daily.push({
				label: getDayLetters(getLastDays(new Date(), 6 - i)),
				value: paidOut,
			})
		}

		// 4 weeks loop
		for (let i = 0; i < 4; i++) {
			const dateRange = generateWeekRange(getLastWeek(new Date(), 3 - i))
			let paidOut = 0

			allRewards.forEach(x => {
				if (x.pending === false && x?.paidOutDate) {
					if ((x.paidOutDate.getTime() >= dateRange.start.getTime()) && (x.paidOutDate.getTime() < dateRange.end.getTime())) paidOut = sumDecimals([paidOut, x.amount])
				}
			})

			dashboardData.junior.paidOut.weekly.push({
				label: `Week ${i + 1}`,
				value: paidOut,
			})
		}

		// 12 months loop
		for (let i = 0; i < 12; i++) {
			const dateRange = generateMonthRange(getLastMonth(new Date(), 11 - i))
			let paidOut = 0

			allRewards.forEach(x => {
				if (x.pending === false && x?.paidOutDate) {
					if ((x.paidOutDate.getTime() >= dateRange.start.getTime()) && (x.paidOutDate.getTime() < dateRange.end.getTime())) paidOut += x.amount
				}
			})

			dashboardData.junior.paidOut.monthly.push({
				label: getMonthLetters(getLastMonth(new Date(), 11 - i)),
				value: paidOut,
			})
		}

		// get the number of junior reporters
		dashboardData.junior.count = reporters.length

		// get wallet balance
		dashboardData.walletBalance = getWalletBalance()

		res.status(201).send(dashboardData)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to edit auth reporter
export const editReporter = async (req: editReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	if (typeof req.body?.reporterID !== "string") return errorJson(res, 400, "Invalid reporter id")

	try {
		const reporter = await Reporter.findById(req.body.reporterID)
		if (!reporter) throw new Error("Reporter not found")

		if (req.body.wallet) reporter.wallet = req.body.wallet
		if (req.body.role === "junior" || req.body.role === "senior" || req.body.role === "admin") reporter.role = req.body.role
		await reporter.save()

		res.status(201).send(reporter)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends post request to pay a reporter
export const payReporter = async (req: payoutReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const { payAll, reporterID } = req.body

		if (typeof reporterID !== "string") throw new Error("Invalid reporterID")
		if (typeof payAll !== "boolean") throw new Error("Invalid payAll")

		if (payAll) {
			type walletsToPayType = { wallet: string, amount: number }[]
			let walletsToPay: walletsToPayType = []

			const reports = await Report.find({ "revenue.rewards.pending": true }, { revenue: 1 }).populate("author", "wallet role")

			// Fill the walletsToPay array
			for (let j = 0; j < reports.length; j++) {
				const report = reports[j];
				const wallet: string = (report.author as any).wallet
				const role: string = (report.author as any).role

				for (let i = 0; i < report.revenue.rewards.length; i++) {
					const reward = report.revenue.rewards[i];
					if (reward.pending === true && role === "junior") {
						const alreadyExists = walletsToPay.find(x => x.wallet === wallet)
						if (alreadyExists) {
							alreadyExists.amount = sumDecimals([reward.amount, alreadyExists.amount])
						} else {
							walletsToPay.push({ wallet, amount: reward.amount })
						}
					}
				}
			}

			// web3 work
			// markal this is for you, pay each walletsToPay.amount to walletsToPay.wallet

			// Saves the reports if they have pending rewards
			for (let j = 0; j < reports.length; j++) {
				const report = reports[j];
				const role: string = (report.author as any).role
				let saveMe = false

				for (let i = 0; i < report.revenue.rewards.length; i++) {
					const reward = report.revenue.rewards[i];
					if (reward.pending === true && role === "junior") {
						reward.pending = false;
						reward.paidOutDate = new Date();
						saveMe = true
					}
				}
				if (saveMe) await report.save()
				// console.log(report)
			}
		} else {
			const reporter = await Reporter.findById(req.body.reporterID)
			if (!reporter) throw new Error("Reporter not found")
			let amountToPay = 0

			const reports = await Report.find({ author: reporter._id, "revenue.rewards.pending": true }, { revenue: 1 })

			// Calculate the amount to pay
			for (let j = 0; j < reports.length; j++) {
				const report = reports[j];
				for (let i = 0; i < report.revenue.rewards.length; i++) {
					const reward = report.revenue.rewards[i];
					if (reward.pending === true && reporter.role === "junior") {
						amountToPay = sumDecimals([reward.amount, amountToPay])
					}
				}
			}

			// web3 work
			// markal this is for you, pay { amountToPay } to the reporter

			// Saves the reports if they have pending rewards
			for (let j = 0; j < reports.length; j++) {
				const report = reports[j];
				let saveMe = false
				for (let i = 0; i < report.revenue.rewards.length; i++) {
					const reward = report.revenue.rewards[i];
					if (reward.pending === true && reporter.role === "junior") {
						reward.pending = false;
						reward.paidOutDate = new Date();
						saveMe = true
					}
				}
				if (saveMe) await report.save()
			}
		}

		res.status(201).send({ message: "success" })
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends delete request to remove reporter discord/twitter data
export const resetReporterSocials = async (req: resetReporterSocialsRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	if (typeof req.query.social !== "string") return errorJson(res, 400, "Invalid social")

	try {
		let reporter: any

		if (req.query.social === "twitter") reporter = await Reporter.findOneAndUpdate({ _id: req.reporter._id }, { $unset: { twitter: "", twitterID: "" } }, { new: true })
		else reporter = await Reporter.findOneAndUpdate({ _id: req.reporter._id }, { $unset: { discord: "", discordID: "" } }, { new: true })

		if (!reporter) throw new Error("Reporter not found")
		await reporter.save()

		res.status(201).send(reporter)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to find a reporter
export const findReporter = async (req: findReporterRequest, res: Response) => {
	const _id = req.query._id
	const wallet = req.query.wallet
	try {
		let reporter: InstanceType<typeof Reporter> | undefined | null

		if (_id) reporter = await Reporter.findById(_id)
		else if (wallet) reporter = await Reporter.findOne({ wallet })
		else return errorJson(res, 400, "Include any of the following as query params: '_id' or 'wallet'")

		if (!reporter) return errorJson(res, 404, "Reporter does not exist")
		res.send(reporter.toPublicJSON())
	} catch (e) {
		return errorJson(res, 500, String(e))
	}
}

// sends get request to find a reporter
export const getReporters = async (req: any, res: Response) => {
	const role = req.query.role
	try {
		let reporter: InstanceType<typeof Reporter> | undefined | null

		const reporters: any = await Reporter.find({ role })
		if (!reporters) return errorJson(res, 404, "Reporters does not exist")
		res.send(reporters)
	} catch (e) {
		return errorJson(res, 500, String(e))
	}
}

export const getJuniorsForPayoutAll = async (req: any, res: Response) => {
	try {

		const reporters = await Reporter.find({ role: "junior" })
		const returnReporters = []
		for (let i = 0; i < reporters.length; i++) {
			const reporter = reporters[i];
			const reports = await Report.find({ "revenue.rewards.pending": true, "reporterWalletAddress": reporter.wallet }, { revenue: 1 }).populate("author", "wallet role")
			if (reports.length > 0) {
				returnReporters.push({ ...reporter })
				console.log('resports', reports)
			}

		}

		res.send({
			message: "success",
			data: returnReporters
		})
	} catch (e) {
		return errorJson(res, 500, String(e))
	}
}


// sends get request to filter reporters
export const filterReporter = async (req: filterReporterRequest, res: Response) => {

	try {
		const { limit, skip, sort } = getLimitSkipSort(req.query?.limit, req.query?.skip, req.query?.sortBy)
		const username = new RegExp(`${req.query?.username ?? ""}`, 'i')

		const reporters = await Reporter.find({ username, role: { $ne: "viewer" && "owner" } }, {
			username: 1, avatar: 1, role: 1, discordID: 1, twitter: 1, wallet: 1, discord: 1
		}).limit(limit).skip(skip).sort(sort).lean()

		const count = await Reporter.find({ username, role: { $ne: "viewer" && "owner" } }).count()
		const returnReporters = []
		for (let i = 0; i < reporters.length; i++) {
			const reporter = reporters[i];
			const reports = await Report.find({ author: reporter._id }, { revenue: 1 }).lean()
			let payout = 0
			for (let j = 0; j < reports.length; j++) {
				const report = reports[j];
				report.revenue.rewards.map(reward => { if (reward.pending) payout = reward.amount + payout })
			}
			returnReporters.push({ ...reporter, payout })
		}

		res.send({
			message: "success", count,
			data: returnReporters
		})
	} catch (e) {
		return errorJson(res, 500, String(e))
	}
}

// sends get request to find a reporter
export const deleteReporter = async (req: deleteReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	if (typeof req.body?.reporterID !== "string") return errorJson(res, 400, "Invalid reporter id")

	try {
		const reporter = await Reporter.findById(req.body.reporterID)
		if (!reporter) throw new Error("Reporter not found")

		// Delete reporter
		await Reporter.deleteOne({ _id: reporter._id })

		// Delete avatar
		if (reporter.avatar) await uploader.destroy("degen-news/reporter-avatar/" + reporter._id)

		// Delete activity
		await Activity.deleteMany({ reporter: reporter._id })
		res.send({ message: 'reporter deleted' })

	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to find a reporter
export const checkReporterExistence = async (req: checkReporterRequest, res: Response) => {
	const wallet = req.query.wallet
	try {
		let reporter: InstanceType<typeof Reporter> | undefined | null
		if (wallet) reporter = await Reporter.findOne({ wallet, role: { $ne: "viewer" } })
		else throw new Error("Invalid params")

		if (reporter === null) { return res.status(200).send({ message: 'reporter does not exist' }) }
		res.send({ message: 'reporter exists' })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// sends get request to edit auth reporter
export const editUsernameReporter = async (req: editReporterRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	if (typeof req.body?.username !== "string") return errorJson(res, 400, "Invalid reporter id")

	try {
		const reporter = req.reporter
		reporter.username = req.body.username
		await reporter.save()
		res.status(201).send(reporter)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends post request to save reporter image
export const saveReporterImage = async (req: saveReporterImageRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
	if (!req.file) return errorJson(res, 400, "No Image Sent")

	try {
		const reporter = req.reporter

		const image = dataUri(req, "djhsdf");
		if (!image) throw new Error('Invalid Image - datauri')

		const cloudImage = await uploader.upload(image, {
			folder: 'degen-news/reporter-avatar',
			public_id: reporter._id.toString(),
			invalidate: true,
		})

		if (cloudImage?.secure_url) {
			reporter.avatar = cloudImage.secure_url
			await reporter.save()
			res.send({ message: 'Image Saved', reporter })
		} else throw new Error("Image issues")

	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// sends post request to remove reporter image
export const removeReporterImage = async (req: deleteReporterImageRequest, res: Response) => {
	if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const reporter = await Reporter.findOneAndUpdate({ wallet: req.reporter.wallet }, { $set: { avatar: reporterDefaultImage } })
		if (!reporter) throw new Error("Invalid wallet")
		res.send({ message: 'Image Saved', image: reporterDefaultImage })

	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}
