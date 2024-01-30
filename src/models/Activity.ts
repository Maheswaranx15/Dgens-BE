import mongoose from 'mongoose'
import { IActivityDocument, IActivityModel } from './_types'

// Sets up activity schema
const activitySchema = new mongoose.Schema({
	reporter: {
		type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Reporter'
	},
	description: {
		type: String,
		required: true,
	}
}, { timestamps: true });

// Create Activity Model
const Activity = mongoose.model<IActivityDocument, IActivityModel>('Activity', activitySchema)

export default Activity