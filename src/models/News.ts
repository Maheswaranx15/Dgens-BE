import mongoose from 'mongoose'
import { INewsDocument, INewsModel } from './_types'

// Sets up news schema
const newsSchema = new mongoose.Schema({
	// ! awaiting
	reportHash: {
		type: String,
		required: true,
		default: 0,
	},
	// ! awaiting
	category: {
		type: String,
		required: true,
		default: "",
	},
	urgency: {
		type: String,
		required: true,
		default: "Normal",
		enum: {
			values: ["critical", "alert", "moderate", "normal"],
			message: `{VALUE} is not supported`
		},
	},
	newsType: {
		type: String,
		required: true,
		default: "",
		enum: {
			values: ["1hr", "3hr", "12hr", "24hr"],
			message: `{VALUE} is not supported`
		},
	},
	headline: {
		type: String,
		required: true,
		default: "",
		max: [160, 'Headline is too long: 160 characters - max']
	},
	description: {
		type: String,
		required: true,
		default: "",
		max: [320, 'Description is too long: 320 characters - max']
	},
	image: {
		type: String,
		trim: true,
		required: true,
	},
	source: {
		type: String,
		required: true,
		default: "",
	},
	twitter: {
		type: String,
		required: true,
		default: "",
	},
	magicEden: {
		type: String,
		required: true,
		default: "",
	},
	status: {
		type: String,
		required: true,
		default: "",
		enum: {
			values: ["rejected", "pending-senior", "pending-admin", "accepted"],
			message: `{VALUE} is not supported`
		},
	},
	acceptedOn: {
		type: String,
		required: true,
		default: "",
	},
	rejectedOn: {
		type: String,
		required: true,
		default: "",
	},
	revenue: {
		type: Number,
		required: true,
		default: 0,
	},
	views: {
		type: Number,
		required: true,
		default: 0,
	},
	reason: {
		type: String,
		required: true,
		default: "",
	},
	tweet: {
		type: String,
		required: true,
		default: "",
	},
}, { timestamps: true });

// Create News Model
const News = mongoose.model<INewsDocument, INewsModel>('News', newsSchema)

export default News