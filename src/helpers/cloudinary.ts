import { v2 as cloudinary } from 'cloudinary'
import {  Request, Response, NextFunction } from 'express';

// Configuration 
export const cloudinaryConfig = (req: Request, res: Response, next: NextFunction) => {
  const cloud = cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  next()
};

export const uploader = cloudinary.uploader