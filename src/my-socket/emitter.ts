import { socketio } from './../index';
import { IActivityInstanceX, IReporterInstance } from '../models/_types'
import Reporter from '../models/Reporter';

export const sendNewActivity = async (act: IActivityInstanceX, rep: string) => {
  const reporter = await Reporter.findById(rep)
  const { followers, following } = { followers: 4, following: 6 }
  const data = {
    _id: act._id,
    username: reporter?.username,
    avatar: reporter?.avatar,
    description: act.description,
    followers, following,
    reporter: reporter?.role,
    createdAt: act.createdAt
  }

  socketio.emit("new-activity", data)
}

export const sendTestData = (data: any) => {
  socketio.emit("test-data", data)
}