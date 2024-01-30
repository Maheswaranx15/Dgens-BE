import express, { Router } from 'express';
import auth from '../middleware/auth'
import { checkUserExistence, createUser, deleteUser, editUser, findUser, followUser, getUser, loginUser, logoutUser, removeUserImage, saveUserImage } from '../controllers/user.controller';
import { multerUploads } from '../helpers/multer';
const router: Router = express.Router()

// Sends post request to create new user
router.post('/create', createUser)

// Sends post request to log user in
router.post('/login', loginUser)

// Sends post request to log user out
router.post('/logout', auth, logoutUser)

// sends get request to fetch auth user
router.get('/get', auth, getUser)

// sends get request to edit auth user
router.patch('/edit', auth, editUser)

// sends post request for auth user to follow another user
router.post('/follow', auth, followUser)

// sends get request to find a user
router.get('/find', findUser)

// Sends delete request to delete users
router.delete('/delete', auth, deleteUser)

// sends get request to check user existence
router.get('/exists', checkUserExistence)

// Sends post request to create and upload the users profile avatar
router.post('/avatar/upload', auth, multerUploads, saveUserImage)

// Sends delete request to delete the users profile avatar
router.delete('/avatar/remove', auth, removeUserImage)

export default router