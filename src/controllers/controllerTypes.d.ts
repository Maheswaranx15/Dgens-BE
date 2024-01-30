import { Request, Response } from 'express';
import Reporter from '../models/Reporter';
import { adTypeList } from '../models/_types';

type Request = Request

type Response = Response

type createReporterRequest = Request<never, never, { wallet?: string, username?: string, discordID?: string, twitter?: string, role?: string }, never>

type loginReporterRequest = Request<never, never, { wallet?: string, signature?: any }, never>

type getCollectionsListRequest = Request<never, never, never, { page?: string }>

interface authReporterRequest extends Request<never, never, never, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface oauathReporterRequest extends Request<never, never, never, { token?: string }> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface deleteReporterRequest extends Request<never, never, { reporterID?: string }, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface resetReporterSocialsRequest extends Request<never, never, never, { social?: string }> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface editReporterRequest extends Request<never, never, {
	reporterID?: string
	username?: string
	wallet?: string
	role?: "senior" | "junior"
	discordID?: string,
	twitter?: string,
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface payoutReporterRequest extends Request<never, never, {
	reporterID?: string
	payAll?: boolean,
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface followReporterRequest extends Request<never, never, { targetID: string }, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface logoutReporterRequest extends Request<never, never, never, {}> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

type findReporterRequest = Request<never, never, never, { _id?: string, wallet?: string }>

type filterReporterRequest = Request<never, never, never, { username?: string, limit?: string, skip?: string, sortBy?: string }>

type checkReporterRequest = Request<never, never, never, { email?: string, wallet?: string }>

interface saveReporterImageRequest extends Request<never, never, { image: any }, { wallet?: string }> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface deleteReporterImageRequest extends Request<never, never, never, {}> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

type createActivityType = (reporter: string, description: string) => Promise<{
	status: "success" | "failure";
}>

interface createReportRequest extends Request<never, never, {
	reportId?: number,
	reporterWalletAddress?: string,
	headlineText?: string,
	headlineMarkup?: string
	description?: string
	urgency?: string
	newsType?: string
	source?: string,
	image?: any,
	magicEden?: string,
	collectionName?: string,
	twitter?: string,
	_id?: string // for author edit report
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface setBreakingReportRequest extends Request<never, never, {
	_id?: string
	breaking?: string
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface disputeReportRequest extends Request<never, never, {
	_id?: string
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface campaignDashboardRequest extends Request<never, never, never, {
	campaignID?: string
}> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface seniorValidateReportRequest extends Request<never, never, {
	_id?: string
	status?: string
	reason?: string

	headlineText?: string,
	headlineMarkup?: string
	description?: string
	urgency?: string
	newsType?: string
	source?: string,
	image?: any,
	magicEden?: string,
	collectionName?: string,
	twitter?: string,
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface tipReportRequest extends Request<never, never, {
	_id?: string
	amount?: number
	secretWeb3PinToVerify?: string
}, never> {
}


interface getReportRequest extends Request<never, never, never, {
	status?: string
	author?: string
	curator?: string
	reportNumber?: string
	urgency?: typeof urgencyTypeList[number]
	newsType?: typeof newsTypeList[number]
	sortBy?: string
	skip?: string
	limit?: string
	collectionName?: string
	creationFrameEnd?: string
	creationFrameStart?: string
	text?: string
}> { }

interface getOneReportRequest extends Request<never, never, never, {
	_id?: string
}> { }

interface getReportNewsRequest extends Request<never, never, never, {
	urgency?: typeof urgencyTypeList[number]
	newsType?: typeof newsTypeList[number]
	sortBy?: string
	skip?: string
	limit?: string
	collectionName?: string
	creationFrameEnd?: string
	creationFrameStart?: string
	text?: string
	specialID?: string
}> { }

interface getActivityRequest extends Request<never, never, never, {
	sortBy?: string
	skip?: string
	limit?: string
}> { }

interface createCampaignRequest extends Request<never, never, {
	campaignId?: number,
	image?: any,
	description?: string
	adType?: string
	twitter?: string
	discord?: string,
	website?: string,
	budget?: string,
	durationStart?: string,
	durationEnd?: string,
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface adminUpdateCampaignStatusRequest extends Request<never, never, {
	_id: string
	status: string
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface getCampaignRequest extends Request<never, never, never, {
	owner?: string
	status?: string
	adType?: typeof adTypeList[number]
	sortBy?: string
	skip?: string
	limit?: string
	creationFrameEnd?: string
	creationFrameStart?: string
	adDate?: "ok"
}> { }

interface getOneCampaignRequest extends Request<never, never, never, {
	campaignID?: string
}> { }

interface getCampaignAdsRequest extends Request<never, never, never, {
	adType?: typeof adTypeList[number]
	sortBy?: string
	skip?: string
	limit?: string
}> { }

interface impressAdsRequest extends Request<never, never, never, {
	_id?: string
}> { }

interface createAPIRequest extends Request<never, never, {
	apiKey?: string
	plan?: string
	name?: string
	webhookURL?: string
	webSocketURL?: string
	deliveryMethod?: string
	filters?: string[]
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface getAPIRequest extends Request<never, never, never, {
	sortBy?: string
	skip?: string
	limit?: string
}> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface createBannerRequest extends Request<never, never, {
	top?: { text: string, markup: string }[]
	bottom?: { text: string, markup: string }[]
}, never> {
	reporter?: InstanceType<typeof Reporter>
	token?: string
}

interface dashboardDataType {
	revenueOvertime: { label: string, value: number }[];
	totalReports: {
		value: number;
		prev: number;
		change: number;
		improved: boolean;
	};
	reportViews: {
		value: number;
		change: number;
		improved: boolean;
		prev: number;
	};
	currentRevenue: {
		value: number;
		change: number;
		prev: number;
		improved: boolean;
	}
	reportAcceptance: number;
	reportBreaking: number;
	platformRevenue: {
		rewards: number;
		tips: number;
		total: number;
	};
	lifetimeRevenue: number;
	lifetimeReports: number;
	lifetimeViews: number;
}

interface rCampaignDashboardDataType {
	totalViews: {
		count: number,
		prev: number,
		change: number,
		data: number[]
	},
	totalImpressions: {
		count: number,
	},
	clickThrough: {
		count: number,
		prev: number,
		change: number,
		data: number[]
	},
	seoItems?: {
		likesData: number[],
		retweetsData: number[],
		impressionsData: number[],
	},
	numberOfVisits: {
		daily: { label, value: number }[]
		weekly: { label, value: number }[]
		monthly: { label, value: number }[]
	},
	overview: {
		views: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		},
		clicks: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		},
		impressions: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		},
	}
}

interface campaignDashboardDataType {
	adViews: {
		count: number,
		prev: number,
		change: number,
		data: { label: string, value: number }[]
	},
	ctr: {
		count: number,
		prev: number,
		change: number,
		data: { label: string, value: number }[]
	},
	clicks: {
		count: number,
		prev: number,
		change: number,
		data: { label: string, value: number }[]
	},
	impressions: {
		count: number,
		prev: number,
		change: number,
		data: { label: string, value: number }[]
	},
	numberOfVisits: {
		daily: { label: string, value: number }[],
		weekly: { label: string, value: number }[],
		monthly: { label: string, value: number }[],
	},
	overview: {
		views: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		},
		clicks: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		}
		impressions: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		}
	}
	seoItems?: {
		likesData: number[],
		retweetsData: number[],
		impressionsData: number[],
	},
}

interface adminDashboardDataType {
	totalViews: {
		count: number,
		prev: number,
		change: number,
		data: number[]
	},
	clickThrough: {
		count: number,
		prev: number,
		change: number,
		data: number[]
	},
	numberOfVisits: {
		daily: { label: string, value: number }[],
		weekly: { label: string, value: number }[],
		monthly: { label: string, value: number }[],
	},
	overview: {
		views: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		},
		clicks: {
			daily: { label, value: number }[]
			weekly: { label, value: number }[]
			monthly: { label, value: number }[]
		}
	}
}

interface adminManageReportersDashboardDataType {
	junior: {
		revenue: number
		count: number
		payoutDue: number
		paidOut: {
			daily: { label: string, value: number }[],
			weekly: { label: string, value: number }[],
			monthly: { label: string, value: number }[],
		}
	},
	walletBalance: number
}

interface collectionHistoryGraphDataType {
	name: string
	symbol: string
	floorPrice: {
		label: string;
		value: number;
		point: boolean;
		pointData?: {
			_id: string;
			category: string;
			headline: {
				text: string;
				markup: string;
			};
			image: string;
		} | undefined
		timestamp: Date
	}[]
	listings: { label: string, value: number, timestamp: Date }[]
}

type getHistoryGraphRequest = Request<never, never, { symbol: string, fromTime: number, toTime: number }, never>
