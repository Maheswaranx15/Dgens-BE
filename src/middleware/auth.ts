import jsonwebtoken from 'jsonwebtoken'
import Reporter from '../models/Reporter'
import { Response, NextFunction } from 'express';
import { authReporterRequest } from '../controllers/controllerTypes';
import { errorJson } from './errors';
import { PublicKey, Connection, Keypair } from "@solana/web3.js"
import bs58 from "bs58"

const jwtSecret: any = process.env.JWT_SECRET
const reporterDefaultImage = (process.env.DEFAULT_USER_IMAGE as string)

const auth = async (req: authReporterRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) throw new Error('Invalid Token')
    const decoded = jsonwebtoken.verify(token, jwtSecret)
    if (typeof decoded === "string") throw new Error("Invalid Token")
    const reporter = await Reporter.findOne({ _id: decoded._id, 'tokens.token': token })
    if (!reporter) throw new Error('Invalid Token')
    if (!["owner", "admin", "senior", "junior"].includes(reporter.role)) {
      const vault = new Keypair()
      const encodedKey = bs58.encode(vault.secretKey)
    
      reporter.role = "junior"; 
			reporter.vault = encodedKey
			reporter.username = reporter.wallet.slice(0, 8)
			reporter.avatar = reporterDefaultImage
			await reporter.save();
    }
    req.token = token
    req.reporter = reporter
    next()
  } catch (error) {
    return errorJson(res, 401, "Not Authenticated")
  }
}
export default auth