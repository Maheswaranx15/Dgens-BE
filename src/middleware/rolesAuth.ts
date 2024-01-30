import { Response, NextFunction } from 'express';
import { authReporterRequest } from '../controllers/controllerTypes';
import { errorJson } from './errors';

export const adminAuth = async (req: authReporterRequest, res: Response, next: NextFunction) => {
  if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
  if (req.reporter?.role !== "admin" && req.reporter?.role !== "owner")  return errorJson(res, 401, "Not an admin")
  next()
}

export const seniorAuth = async (req: authReporterRequest, res: Response, next: NextFunction) => {
  if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
  if (req.reporter?.role !== "senior") return errorJson(res, 401, "Not a senior reporter")
  next()
}

export const juniorAuth = async (req: authReporterRequest, res: Response, next: NextFunction) => {
  if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
  if (req.reporter?.role !== "junior") return errorJson(res, 401, "Not a junior reporter")
  next()
}

export const reporterAuth = async (req: authReporterRequest, res: Response, next: NextFunction) => {
  if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")
  if (req.reporter?.role === "viewer") return errorJson(res, 401, "Not a reporter")
  next()
}