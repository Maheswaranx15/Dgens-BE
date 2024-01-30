import mongoose from 'mongoose'
import { ICounterDocument, ICounterModel } from './_types';

// Sets up counter schema
const counterSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		dropDups: true
	},
	count: {
		type: Number,
		default: 1,
		required: true,
	}
});

// generate number
counterSchema.statics.generateNextCount = async (name: string) => {
	let counter = await Counter.findOneAndUpdate({ name }, {
		$inc: { count: 1 }
	}, { new: true })
	if (!counter) counter = await Counter.create({ name, count: 1 })

	return counter.count
}

// Create Counter Model
const Counter = mongoose.model<ICounterDocument, ICounterModel>('Counter', counterSchema)

export default Counter