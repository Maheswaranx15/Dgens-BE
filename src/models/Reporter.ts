import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'
import { IReporterDocument, IReporterModel } from './_types'
const jwtSecret: any = process.env.JWT_SECRET

// Sets up reporter schema
const reporterSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate(value: string) {
      if (/[^a-z\-\_0-9]/g.test(value)) {
        throw new Error('Invalid username')
      }
    }
  },
  wallet: {
    type: String,
    required: true,
    unique: true,
    dropDups: true
  },
  vault: {
		type: String,
		required: true
	},
  role: {
    type: String,
    required: true,
    enum: {
      values: ["owner", "admin", "senior", "junior", "viewer"],
      message: `{VALUE} is not supported`
    },
    default: "junior"
  },
  discordID: {
    type: String,
    required: false,
  },
  discord: {
    type: String,
    required: false,
  },
  twitterID: {
    type: String,
    required: false,
  },
  twitter: {
    type: String,
    required: false,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  avatar: {
    type: String,
    trim: true,
    required: true,
  },
}, { timestamps: true });

// Create Virtual relationship with Activity
reporterSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'reporter'
})

// Create Virtual relationship with an author Reports
reporterSchema.virtual('reports', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'author',
})

// Create Virtual relationship with a curator Reports
reporterSchema.virtual('curated', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'curator',
})

// Generate Authentication Token
reporterSchema.methods.generateAuthToken = async function (): Promise<string> {
  const reporter = this
  const token = jsonwebtoken.sign({ _id: reporter.id.toString() }, jwtSecret, {})
  reporter.tokens.push({ token })
  await reporter.save()
  return token
}

// Private profile
reporterSchema.methods.toJSON = function (): JSON {
  const reporter = this
  const returnReporter = reporter.toObject()
  delete returnReporter.tokens
  return returnReporter
}

// Public profile
reporterSchema.methods.toPublicJSON = function (): JSON {
  const reporter = this
  const returnReporter = reporter.toObject()
  delete returnReporter.tokens
  return returnReporter
}

// Create Reporter Model
const Reporter = mongoose.model<IReporterDocument, IReporterModel>('Reporter', reporterSchema)

export default Reporter