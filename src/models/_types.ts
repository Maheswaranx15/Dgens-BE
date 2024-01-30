import { Document, Model, Types } from "mongoose"
import Reporter from "./Reporter"
import Activity from "./Activity"
import Report from "./Report"
import FrontEndSession from "./FrontEndSession"
import Counter from "./Counter"
import Campaign from "./Campaign"
import API from "./API"
import CollectionName from "./CollectionName"
import Visit from "./Visit"
import Banner from "./Banner"

// Reporter Model
export interface IReporter {
	username?: string
	wallet: string,
	vault: string,
	role: "owner" | "admin" | "senior" | "junior" | "viewer"
	avatar?: string
	discordID?: string,
	discord?: string,
	twitterID?: string,
	twitter?: string,
	tokens: { token: string; }[]
	toPublicJSON: () => Object
	generateAuthToken: () => Promise<string>
}
export interface IReporterDocument extends IReporter, Document { }
export interface IReporterModel extends Model<IReporterDocument> {
	// buildReporter(args: IReporter): IReporterDocument
	// findbyCredentials: (wallet: string, password: string) => Promise<InstanceType<typeof Reporter>>
}
export type IReporterInstance = InstanceType<typeof Reporter> | undefined | null


// Activity Model
export interface IActivity {
	reporter: Types.ObjectId
	description: string
	createdAt: NativeDate
	updatedAt: NativeDate
}
export type IActivityInstance = InstanceType<typeof Activity> | undefined | null
export type IActivityInstanceX = InstanceType<typeof Activity>
export interface IActivityDocument extends IActivity, Document { }
export interface IActivityModel extends Model<IActivityDocument> {
}


// Report Model
export const urgencyTypeList = ['Past 1 hour', 'Past 3 hours', 'Past 24 Hours', 'Future'] as const
export const newsTypeList = ["yes", "no"] as const
export interface IReport {
	// _id: string
	reportId: number
	reporterWalletAddress: string
	author: Types.ObjectId
	curator?: Types.ObjectId
	publisher?: Types.ObjectId
	reportHash: number
	headline: {
		text: string,
		markup: string
	}
	description?: string
	urgency: typeof urgencyTypeList[number]
	newsType: typeof newsTypeList[number]
	image?: string,
	source: string,
	views: { createdAt: NativeDate }[],
	revenue: {
		tips: {
			amount: number
			createdAt: NativeDate
		}[]
		rewards: {
			amount: number
			pending: boolean
			paidOutDate?: Date
			createdAt: NativeDate
		}[]
	},
	status: 'pending' | 'accepted' | 'rejected' | 'published'
	acceptedOn?: NativeDate,
	rejectedOn?: NativeDate,
	publishedOn?: NativeDate,
	reason?: string,
	twitter?: string,
	collectionName?: string,
	magicEden?: string,
	dispute?: boolean,
	breaking?: "top" | "bottom"
	createdAt: NativeDate
	updatedAt: NativeDate
}

export type IReportInstance = InstanceType<typeof Report> | undefined | null
export type IReportInstanceX = InstanceType<typeof Report>
export interface IReportDocument extends IReport, Document { }
export interface IReportModel extends Model<IReportDocument> {
}


// FrontEndSession Model
export interface IFrontEndSession {
	apiKey: string
	expireAt: string
}

export type IFrontEndSessionInstance = InstanceType<typeof FrontEndSession> | undefined | null
export interface IFrontEndSessionDocument extends IFrontEndSession, Document { }
export interface IFrontEndSessionModel extends Model<IFrontEndSessionDocument> {
}


// Visit Model
export interface IVisit {
	name: string
	createdAt: NativeDate
}

export type IVisitInstance = InstanceType<typeof Visit> | undefined | null
export interface IVisitDocument extends IVisit, Document { }
export interface IVisitModel extends Model<IVisitDocument> {
}


// Counter Model
export interface ICounter {
	name: string
	count: number
}

export type ICounterInstance = InstanceType<typeof Counter> | undefined | null
export interface ICounterDocument extends ICounter, Document { }
export interface ICounterModel extends Model<ICounterDocument> {
	generateNextCount: (name: string) => Promise<number>
}


// CollectionName Model
export interface ICollectionName {
	name: string
}

export type ICollectionNameInstance = InstanceType<typeof CollectionName> | undefined | null
export interface ICollectionNameDocument extends ICollectionName, Document { }
export interface ICollectionNameModel extends Model<ICollectionNameDocument> {
	saveAnother: (name: string) => Promise<boolean>
}


// Campaign Model
export const adTypeList = ["banner", "not-banner"] as const
export interface ICampaign {
	campaignId: number,
	owner: Types.ObjectId
	judges: {
		judge: Types.ObjectId
		action: "approved" | "running" | "rejected" | "ended"
	}[]
	campaignID: number
	spendings: number
	status: "new" | "approved" | "running" | "rejected" | "ended"
	image: { mobile: string, desktop: string }
	adType: typeof adTypeList[number]
	description: string
	website: string
	twitter: string
	discord: string
	adDuration: { start: NativeDate, end: NativeDate }
	views: { createdAt: NativeDate }[],
	clicks: { createdAt: NativeDate }[],
	impressions: { createdAt: NativeDate }[],
	createdAt: NativeDate
	updatedAt: NativeDate
}

export type ICampaignInstance = InstanceType<typeof Campaign> | undefined | null
export interface ICampaignDocument extends ICampaign, Document { }
export interface ICampaignModel extends Model<ICampaignDocument> {
}


// API Model
export const apiFiltersList = ["sponsorship", "clash", "support", "collaboration", "breaking", "icymi"] as const
export interface IAPI {
	owner: Types.ObjectId
	apiKey: string
	plan: "free" | "enterprise" | "standard" | "starter"
	name: string
	webhookURL: string
	webSocketURL: string
	deliveryMethod: "websocket" | "webhook"
	filters: typeof apiFiltersList[number][]
	createdAt: NativeDate
	updatedAt: NativeDate
}

export type IAPIInstance = InstanceType<typeof API> | undefined | null
export interface IAPIDocument extends IAPI, Document { }
export interface IAPIModel extends Model<IAPIDocument> {
}


// Banner Model
export interface IBanner {
	name: "top" | "bottom"
	data: { text: string, markup: string }[]
	createdAt: NativeDate
	updatedAt: NativeDate
}

export type IBannerInstance = InstanceType<typeof Banner> | undefined | null
export interface IBannerDocument extends IBanner, Document { }
export interface IBannerModel extends Model<IBannerDocument> {
}
