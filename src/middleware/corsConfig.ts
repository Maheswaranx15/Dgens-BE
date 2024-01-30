import cors from 'cors';

// Acquires the front end location
const frontEndLocations = process.env.FRONT_END_LOCATIONS ?? ""

// Obtain allow tools info
const allowTools = process.env.ALLOW_TOOLS === "true"

const corsConfig = cors({
  origin: (origin, callback) => {
    if (allowTools) {
      if (frontEndLocations.split(",").indexOf(origin ?? "") !== -1 || !origin) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    } else {
      if (frontEndLocations.split(",").indexOf(origin ?? "") !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
})

export default corsConfig
