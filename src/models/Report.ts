import mongoose from 'mongoose'
import { IReportDocument, IReportInstanceX, IReportModel, newsTypeList, urgencyTypeList } from './_types'
import isURL from 'validator/lib/isURL';
import CollectionName from './CollectionName';

// Sets up report schema
const reportSchema = new mongoose.Schema({
	reportId: {
		type: Number,
		required: true,
		unique: true
	},
	reporterWalletAddress: {
		type: String,
		required: true
	},
	author: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'Reporter'
	},
	curator: {
		type: mongoose.Schema.Types.ObjectId,
		required: false,
		ref: 'Reporter'
	},
	publisher: {
		type: mongoose.Schema.Types.ObjectId,
		required: false,
		ref: 'Reporter'
	},
	reportHash: {
		type: String,
		required: true,
		unique: true,
		dropDups: true,
	},
	headline: {
		text: {
			type: String,
			required: true,
		},
		markup: {
			type: String,
			required: true,
		}
	},
	description: {
		type: String,
		required: false,
	},
	urgency: {
		type: String,
		required: true,
		default: "normal",
		enum: {
			values: urgencyTypeList,
			message: `{VALUE} is not supported`
		},
	},
	newsType: {
		type: String,
		required: true,
		default: "partnership",
		enum: {
			values: newsTypeList,
			message: `{VALUE} is not supported`
		},
	},
	image: {
		type: String,
		trim: true,
		required: false,
	},
	source: {
		type: String,
		required: true,
		validate(value: string) {
			if (!isURL(value)) {
				throw new Error('Should be a url')
			}
		}
	},
	twitter: {
		type: String,
		required: false,
		validate(value: string) {
			if (!isURL(value)) {
				throw new Error('Should be a url')
			}
		}
	},
	collectionName: {
		type: String,
		required: false,
	},
	magicEden: {
		type: String,
		required: false,
		validate(value: string) {
			if (!isURL(value)) {
				throw new Error('Should be a url')
			}
		}
	},
	views: [
		new mongoose.Schema({
		}, { timestamps: { createdAt: true, updatedAt: false } })
	],
	revenue: {
		tips: [
			new mongoose.Schema({
				amount: {
					type: Number,
					required: true,
				}
			}, { timestamps: { createdAt: true, updatedAt: false } })
		],
		rewards: [
			new mongoose.Schema({
				amount: {
					type: Number,
					required: true,
				},
				pending: {
					type: Boolean,
					required: true,
				},
				paidOutDate: {
					type: Date,
					required: false
				}
			}, { timestamps: { createdAt: true, updatedAt: false } })
		]
	},
	status: {
		type: String,
		required: true,
		default: "pending",
		enum: {
			values: ['pending', 'accepted', 'rejected', 'published'],
			message: `{VALUE} is not supported`
		},
	},
	acceptedOn: {
		type: Date,
		required: false,
	},
	rejectedOn: {
		type: Date,
		required: false,
	},
	publishedOn: {
		type: Date,
		required: false,
	},
	reason: {
		type: String,
		required: false,
	},
	dispute: {
		type: Boolean,
		default: false,
		required: false
	},
	breaking: {
		type: String,
		required: false,
		enum: {
			values: ['top', 'bottom'],
			message: `{VALUE} is not supported`
		},
	},
	signature: {
		type: String,
		required: false,
	},
	mint: {
		type: String,
		required: false
	},
}, { timestamps: true });

reportSchema.index({
	"headline.text": "text",
	description: "text"
}, {
	weights: { "headline.text": 7, description: 3 },
	name: "headline_description"
});

// Private profile
reportSchema.methods.toJSON = function (): JSON {
	const report = (this as IReportInstanceX)
	const returnReport: any = report.toObject()
	if (returnReport.views) returnReport.views = report.views.length

	let payout = 0
	report?.revenue?.rewards?.forEach?.(reward => { if (reward.pending) payout = reward.amount + payout })

	let paidOut = 0
	report?.revenue?.tips?.forEach?.(tip => { paidOut = tip.amount + paidOut })
	report?.revenue?.rewards?.forEach?.(reward => { if (!reward.pending) paidOut = reward.amount + paidOut })

	let income = 0
	report?.revenue?.tips?.forEach?.(tip => { income = tip.amount + income })
	report?.revenue?.rewards?.forEach?.(reward => { income = reward.amount + income })

	returnReport.payout = payout
	returnReport.paidOut = paidOut
	returnReport.income = income

	returnReport.reportHash = parseInt(report.reportHash as unknown as string)

	return returnReport
}

reportSchema.pre('save', async function (next) {
  const report = this
  // if (report.isModified('collectionName') && report.collectionName) await CollectionName.saveAnother(report.collectionName)
  next()
})


// Create Report Model
const Report = mongoose.model<IReportDocument, IReportModel>('Report', reportSchema)

export default Report