import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'
import { IUserDocument, IUserModel } from './_types'
import isEmail from 'validator/lib/isEmail'
const jwtSecret: any = process.env.JWT_SECRET

// Sets up user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate(value: string) {
      if (/[^a-z\-\_0-9]/g.test(value)) {
        throw new Error('Unique Name is invalid')
      }
    }
  },
  wallet: {
    type: String,
    required: true,
    unique: true,
    dropDups: true 
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ["admin", "senior", "junior"],
      message: `{VALUE} is not supported`
    },
    default: "junior"
  },
  email: {
    type: String,
    trim: true,
    unique: false,
    required: false,
    lowercase: true,
    validate(value: string) {
      if (!isEmail(value)) {
        throw new Error('Email is invalid')
      }
    }
  },
  password: {
    type: String,
    trim: true,
    required: true,
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
  followers: [
    new mongoose.Schema({
      followerID: {
        type: String,
        required: true
      },
    }, { timestamps: true })
  ],
  following: [
    new mongoose.Schema({
      followingID: {
        type: String,
        required: true
      }
    }, { timestamps: true })
  ],
}, { timestamps: true });

// Create Virtual relationship with Activity
userSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'userID'
})

// Generate Authentication Token
userSchema.methods.generateAuthToken = async function (): Promise<string> {
  const user = this
  const token = jsonwebtoken.sign({ _id: user.id.toString() }, jwtSecret, {})
  user.tokens.push({ token })
  await user.save()
  return token
}

// Private profile
userSchema.methods.toJSON = function (): JSON {
  const user = this
  const returnUser = user.toObject()
  delete returnUser.password
  delete returnUser.tokens
  return returnUser
}

// Public profile
userSchema.methods.toPublicJSON = function (): JSON {
  const user = this
  const returnUser = user.toObject()
  delete returnUser.password
  delete returnUser.tokens
  return returnUser
}

// For login
userSchema.statics.findbyCredentials = async (wallet, password) => {
  const user = await User.findOne({ wallet })
  if (!user) throw new Error('Unable to login')
  const isMatch = await bcryptjs.compare(password, user.password)
  if (!isMatch) throw new Error('Unable to login')
  return user
}

// Hash password
userSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) user.password = await bcryptjs.hash(user.password, 8)
  next()
})

// Create User Model
const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema)

export default User