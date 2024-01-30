import {  Request, Response, NextFunction } from 'express';

const delay = async (req: Request, res: Response, next: NextFunction) => {

  await new Promise(resolve => setTimeout(resolve, 1000))

  next()

}

export default delay