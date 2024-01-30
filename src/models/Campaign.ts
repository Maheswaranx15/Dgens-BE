import mongoose from 'mongoose'
import { ICampaignDocument, ICampaignModel, adTypeList, newsTypeList, urgencyTypeList } from './_types'
import isURL from 'validator/lib/isURL';

// Sets up campaign schema
const campaignSchema = new mongoose.Schema({
	campaignId: {
		type: Number,
		required: true,
		unique: true
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'Reporter'
	},
	judges: [
		new mongoose.Schema({
			judge: {
				type: mongoose.Schema.Types.ObjectId,
				required: false,
				ref: 'Reporter'
			},
			action: {
				type: String,
				required: true,
				enum: {
					values: ["approved", "running", "rejected", "ended"],
					message: `{VALUE} is not supported`
				},
			}
		}, { timestamps: { createdAt: true, updatedAt: false } })
	],
	campaignID: {
		type: Number,
		required: true,
		unique: true,
		dropDups: true,
	},
	spendings: {
		type: Number,
		required: true,
	},
	status: {
		type: String,
		required: true,
		enum: {
			values: ["new", "approved", "running", "rejected", "ended"],
			message: `{VALUE} is not supported`
		},
	},
	image: {
		desktop: {			
			type: String,
			trim: true,
			required: false,
		},
		mobile: {
			type: String,
			trim: true,
			required: false,
		},
	},
	adType: {
		type: String,
		required: true,
		enum: {
			values: adTypeList,
			message: `{VALUE} is not supported`
		},
	},
	description: {
		type: String,
		required: true,
	},
	website: {
		type: String,
		required: true,
		validate(value: string) {
      if (!isURL(value) || !value.startsWith("https://")) {
        throw new Error('Should be a url')
      }
    }
	},
	twitter: {
		type: String,
		required: true,
		validate(value: string) {
      if (!isURL(value)) {
        throw new Error('Should be a url')
      }
    }
	},
	discord: {
		type: String,
		required: true,
		validate(value: string) {
      if (!isURL(value)) {
        throw new Error('Should be a url')
      }
    }
	},
	adDuration: {
		start: {
			type: Date,
			required: true
		},
		end: {
			type: Date,
			required: true
		},
	},
	views: [
		new mongoose.Schema({
		}, { timestamps: { createdAt: true, updatedAt: false } })
	],
	clicks: [
		new mongoose.Schema({
		}, { timestamps: { createdAt: true, updatedAt: false } })
	],
	impressions: [
		new mongoose.Schema({
		}, { timestamps: { createdAt: true, updatedAt: false } })
	],
}, { timestamps: true });


// Private profile
campaignSchema.methods.toJSON = function (): JSON {
	const campaign = this
	const returnCampaign = campaign.toObject()
	if (returnCampaign.views) returnCampaign.views = returnCampaign.views.length
	if (returnCampaign.clicks) returnCampaign.clicks = returnCampaign.clicks.length
	if (returnCampaign.impressions) returnCampaign.impressions = returnCampaign.impressions.length
	// if (returnCampaign.status === "running" &&  (new Date().getTime() > new Date(returnCampaign.adDuration.end).getTime())) returnCampaign.status = "ended"
	return returnCampaign
}

// Create Campaign Model
const Campaign = mongoose.model<ICampaignDocument, ICampaignModel>('Campaign', campaignSchema)

export default Campaign