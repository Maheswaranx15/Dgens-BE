import User from "../models/User"
import { errorJson } from "../middleware/errors";
import { Response, authUserRequest, checkUserRequest, createUserRequest, findUserRequest, followUserRequest, loginUserRequest, logoutUserRequest, saveUserImageRequest } from "./controllerTypes";
import { uploader } from "../helpers/cloudinary";
import { dataUri } from "../helpers/multer";
import { IUserInstance } from "../models/_types";
import Activity from "../models/Activity";
import { createActivity } from "./activities.controller";

const userDefaultImage = (process.env.DEFAULT_USER_IMAGE as string)

// Sends post request to create new user
export const createUser = async (req: createUserRequest, res: Response) => {
	try {

		const wallet = req.body?.wallet
		if (typeof wallet !== "string") throw new Error("Invalid wallet")

		const user = new User({
			followers: [],
			following: [], wallet,
			status: "junior",
			username: wallet.slice(0, 5),
			password: wallet.slice(0, 5),
		})

		const cloudImage = await uploader.upload(userDefaultImage, {
			folder: 'degen-news/user-avatar',
			public_id: user._id.toString(),
			invalidate: true,
		})

		if (cloudImage?.secure_url) {
			user.avatar = cloudImage.secure_url
		} else throw new Error("Image issues")

		await user.save()
		const token = await user.generateAuthToken()
		res.status(201).send({ ...user.toJSON(), token })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to log user in
export const loginUser = async (req: loginUserRequest, res: Response) => {

	try {
		const { wallet, password } = req.body
		if (typeof wallet !== "string") throw new Error("Invalid wallet")
		if (typeof password !== "string") throw new Error("Invalid password")

		const user = await User.findbyCredentials(wallet, password)
		const token = await user.generateAuthToken()
		res.status(201).send({ ...user.toJSON(), token })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// Sends post request to log user in
export const logoutUser = async (req: logoutUserRequest, res: Response) => {
	if (!req.user || !req.token) return errorJson(res, 401, "Not Logged In")

	const user = req.user
	const token = req.token
	try {
		user.tokens = user.tokens.filter(item => item.token !== token)
		await user.save()
		res.status(200).send({ message: 'Logout Successful' })
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to fetch auth user
export const getUser = async (req: authUserRequest, res: Response) => {
	if (!req.user || !req.token) return errorJson(res, 401, "Not Logged In")
	res.send(req.user)
}

// sends get request to edit auth user
export const editUser = async (req: authUserRequest, res: Response) => {
	if (!req.user || !req.token) return errorJson(res, 401, "Not Logged In")
	try {
		const updates = Object.keys(req.body)
		const allowedUpdate = ['username', 'email']
		const isValidOp = updates.every(item => allowedUpdate.includes(item))
		if (!isValidOp) return res.status(400).send({ error: 'Invalid Updates', allowedUpdates: allowedUpdate })
		const user = req.user
		// @ts-ignore
		updates.forEach(item => user[item] = req.body[item])
		await user.save()
		res.status(201).send(user)
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends post request for auth user to follow another user
export const followUser = async (req: followUserRequest, res: Response) => {
	if (!req.user || !req.token) return errorJson(res, 401, "Not Logged In")
	if (!req.body.targetID) return errorJson(res, 400, "No targetID")
	try {
		const targetID = req.body.targetID
		const userID = req.user._id.toString()

		if (userID === targetID) throw new Error("You can't follow yourself")

		let user: IUserInstance
		let target: IUserInstance

		target = await User.findOneAndUpdate({ _id: targetID, "followers.followerID": { "$ne": userID } }, {
			"$push": { "followers": { followerID: userID } },
		}, { "new": true })

		if (!target) {
			target = await User.findOneAndUpdate({ _id: targetID, "followers.followerID": { "$in": userID } }, {
				"$pull": { "followers": { followerID: userID } },
			}, { "new": true })
			await createActivity(userID, `Stopped following ${target?.username ?? "someone"}`)
		} else {
			await createActivity(userID, `Started following ${target?.username ?? "someone"}`)
		}

		user = await User.findOneAndUpdate({ _id: userID, "following.followingID": { "$ne": targetID } }, {
			"$push": { "following": { followingID: targetID } },
		}, { "new": true })

		if (!user) user = await User.findOneAndUpdate({ _id: userID, "following.followingID": { "$in": targetID } }, {
			"$pull": { "following": { followingID: targetID } },
		}, { "new": true })

		if (!target) throw new Error("Invalid targetID")
		if (!user) throw new Error("Invalid userID")

		res.status(201).send({ target: target.toPublicJSON(), user })
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to find a user
export const findUser = async (req: findUserRequest, res: Response) => {
	const _id = req.query._id
	const wallet = req.query.wallet
	try {
		let user: InstanceType<typeof User> | undefined | null

		if (_id) user = await User.findById(_id)
		else if (wallet) user = await User.findOne({ wallet })
		else return errorJson(res, 400, "Include any of the following as query params: '_id' or 'wallet'")

		if (!user) return errorJson(res, 404, "User does not exist")
		res.send(user.toPublicJSON())
	} catch (e) {
		return errorJson(res, 500, String(e))
	}
}

// sends get request to find a user
export const deleteUser = async (req: authUserRequest, res: Response) => {
	if (!req.user || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const user = req.user

		// Delete user
		await User.deleteOne({ _id: user._id })

		// Delete avatar
		if (user.avatar) await uploader.destroy("degen-news/user-avatar/" + user._id)

		// Delete activity
		await Activity.deleteMany({ userID: user._id })

		// Delete followers
		await User.updateMany({ "followers.followerID": { "$in": user._id } }, {
			"$pull": { "followers": { followerID: user._id } },
		}, { "new": true })

		// Delete following
		await User.updateMany({ "following.followingID": { "$in": user._id } }, {
			"$pull": { "following": { followingID: user._id } },
		}, { "new": true })

		res.send({ message: 'user deleted' })
	} catch (error) {
		return errorJson(res, 500, String(error))
	}
}

// sends get request to find a user
export const checkUserExistence = async (req: checkUserRequest, res: Response) => {
	const email = req.query.email
	const wallet = req.query.wallet
	try {
		let user: InstanceType<typeof User> | undefined | null
		if (email) user = await User.findOne({ email })
		else if (wallet) user = await User.findOne({ wallet })
		else throw new Error("Invalid params")

		if (user === null) { return res.status(200).send({ message: 'user does not exist' }) }
		res.send({ message: 'user exists' })
	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}

// sends post request to save user image
export const saveUserImage = async (req: saveUserImageRequest, res: Response) => {
	if (!req.user || !req.token) return errorJson(res, 401, "Not Logged In")
	if (!req.file) return errorJson(res, 401, "No Image Sent")

	try {
		const user = req.user
		const image = dataUri(req, "djhsdf");
		if (!image) throw new Error('Invalid Image - datauri')

		const cloudImage = await uploader.upload(image, {
			folder: 'degen-news/user-avatar',
			public_id: user._id.toString(),
			invalidate: true,
		})

		if (cloudImage?.secure_url) {
			user.avatar = cloudImage.secure_url
			await user.save()
			res.send({ message: 'Image Saved' })
		} else throw new Error("Image issues")

	} catch (error) {
		console.log(error);
		return errorJson(res, 400, String(error))
	}
}

// sends post request to remove user image
export const removeUserImage = async (req: authUserRequest, res: Response) => {
	if (!req.user || !req.token) return errorJson(res, 401, "Not Logged In")

	try {
		const user = req.user

		const cloudImage = await uploader.upload(userDefaultImage, {
			folder: 'degen-news/user-avatar',
			public_id: user._id.toString(),
			invalidate: true,
		})

		if (cloudImage?.secure_url) {
			user.avatar = cloudImage.secure_url
			await user.save()
			res.send({ message: 'Image Saved' })
		} else throw new Error("Image issues")

	} catch (error) {
		return errorJson(res, 400, String(error))
	}
}
