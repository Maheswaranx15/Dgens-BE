import jsonwebtoken from 'jsonwebtoken'
import Reporter from '../models/Reporter'
import { Response, NextFunction } from 'express';
import { oauathReporterRequest } from '../controllers/controllerTypes';
import { errorJson } from './errors';
const jwtSecret: any = process.env.JWT_SECRET

const oauthAuth = async (req: oauathReporterRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token
    if (!token) throw new Error('Invalid Token')
    const decoded = jsonwebtoken.verify(token, jwtSecret)
    if (typeof decoded === "string") throw new Error("Invalid Token")
    const reporter = await Reporter.findOne({ _id: decoded._id, 'tokens.token': token })
    if (!reporter) throw new Error('Invalid Token')
    req.token = token
    req.reporter = reporter
    next()
  } catch (error) {
    return errorJson(res, 401, "Not Authenticated")
  }
}
export default oauthAuth