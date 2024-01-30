import mongoose from 'mongoose'
import { IFrontEndSessionDocument, IFrontEndSessionModel } from './_types'

// Sets up frontEndSession schema
const frontEndSessionSchema = new mongoose.Schema({
	apiKey: {
		type: String,
		required: true,
	},
	expireAt: {
		type: Date,
		required: true,
		index: { expireAfterSeconds: 0 },
	},
});

// Create FrontEndSession Model
const FrontEndSession = mongoose.model<IFrontEndSessionDocument, IFrontEndSessionModel>('FrontEndSession', frontEndSessionSchema)

export default FrontEndSession