import mongoose from 'mongoose'
import { IBannerDocument, IBannerModel } from './_types'

// Sets up banner schema
const bannerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		enum: {
			values: ["top", "bottom"],
			message: `{VALUE} is not supported`
		},
	},
	data: [{
		text: {
			type: String,
			required: false,
		},
		markup: {
			type: String,
			required: true,
		},
	}]
}, { timestamps: { createdAt: true, updatedAt: false } });

// Create Banner Model
const Banner = mongoose.model<IBannerDocument, IBannerModel>('Banner', bannerSchema)

export default Banner