import mongoose from 'mongoose'
import { ICollectionNameDocument, ICollectionNameModel } from './_types';

// Sets up collectionName schema
const collectionNameSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		dropDups: true
	},
});

// generate number
collectionNameSchema.statics.saveAnother = async (name: string) => {
	let collectionName = await CollectionName.findOne({ name })
	if (!collectionName) collectionName = await CollectionName.create({ name })

	return true
}

// Create CollectionName Model
const CollectionName = mongoose.model<ICollectionNameDocument, ICollectionNameModel>('CollectionName', collectionNameSchema)

export default CollectionName