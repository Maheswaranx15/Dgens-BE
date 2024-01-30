import mongoose from 'mongoose'
import { IAPIDocument, IAPIModel, apiFiltersList } from './_types'

// Sets up api schema
const apiSchema = new mongoose.Schema({
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'Reporter'
	},
	apiKey: {
		type: String,
		required: true,
		unique: true,
		dropDups: true,
	},
	plan: {
		type: String,
		required: true,
		enum: {
			values: ["free", "enterprise", "standard", "starter"],
			message: `{VALUE} is not supported`
		},
	},
	name: {
		type: String,
		required: true,
	},
	webhookURL: {
		type: String,
		required: false,
	},
	deliveryMethod: {
		type: String,
		required: true,
		enum: {
			values: ["websocket", "webhook"],
			message: `{VALUE} is not supported`
		},
	},
	filters: [{
		type: String,
		required: true,
		enum: {
			values: apiFiltersList,
			message: `{VALUE} is not supported`
		},
	}],
}, { timestamps: true });

// Create API Model
const API = mongoose.model<IAPIDocument, IAPIModel>('API', apiSchema)

export default API