import mongoose from 'mongoose'
import { IVisitDocument, IVisitModel } from './_types'

// Sets up visit schema
const visitSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
}, { timestamps: { createdAt: true, updatedAt: false } });

// Create Visit Model
const Visit = mongoose.model<IVisitDocument, IVisitModel>('Visit', visitSchema)

export default Visit