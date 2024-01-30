// Import Statements
import './middleware/init';
import './db/mongoose';
import './oauth/twitterPassport';
import './oauth/discordPassport';
import hbs from 'hbs';
import path from 'path';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import chalk from 'chalk';
import delay from './middleware/delay';
import _404Router from './routers/404.routes';
import normalRouter from './routers/normal.routes';
import reporterRouter from './routers/reporter.routes';
import reportRouter from './routers/report.routes';
import campaignRouter from './routers/campaign.routes';
import apiRouter from './routers/api.routes';
import bannerRouter from './routers/banner.routes';
import priceImpactRouter from './routers/price-impact.routes';
import miscRouter from './routers/misc.routes';
import oauthRouter from './oauth/oauth.routes';
// import corsConfig from './middleware/corsConfig';
import { format } from 'date-fns';
import { cloudinaryConfig } from './helpers/cloudinary';
import commonAuth from './middleware/commonAuth';
import passport from 'passport';
import expressSess from './middleware/expressSess';
import { testTwitter } from './twitter/index'
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();
// Acquires the port on which the application runs
const port = process.env.PORT

// Reterieves the application allowed front end locations
const frontEndLocations = process.env.FRONT_END_LOCATIONS ?? ""

// Reterieves the application production status
const isProduction = process.env.IS_PRODUCTION === 'true'

// Acquire an instance of Express
const app: Express = express();

// Acquire an instance of the Server
const server = createServer(app);

// Instantiate socket
const io = new Server(server, {
  cors: {
    origin: frontEndLocations.split(",") ?? []
  }
});
export const socketio = io

app.use(cors());

// Obtain the public path
const publicPath = path.join(__dirname, '../public')

// Obtain the views path
const viewsPath = path.join(__dirname, '../template/views')

// Obtain the partials path
const partialsPath = path.join(__dirname, '../template/partials')

// Sets the view engine to HBS
app.set('view engine', 'hbs')

// Automatically serve view hbs files
app.set('views', viewsPath)

// Automatically serve partials as hbs files
hbs.registerPartials(partialsPath)

// Automatically serve public (static) files
app.use(express.static(publicPath))

// Automatically parse incoming requests and 20mb limit
app.use(express.json({ limit: "50mb" }))

// Automatically parse form body and encodes
app.use(express.urlencoded({ extended: true }))

// Automatically allow incomming incoming cors
// app.use(corsConfig)



// One second delay for local development
if (!isProduction) { app.use(delay) }

// cloudinary setup
app.use(cloudinaryConfig);

// Twitter setup
testTwitter()

// Express session for passport
app.use(expressSess)

// Setup passport
app.use(passport.initialize());
app.use(passport.session());

// Automatically allows normal routes
app.use(normalRouter)

// Automatically allows report routes
app.use("/api/report", commonAuth, reportRouter)

// Automatically allows reporter routes
app.use("/api/reporter", commonAuth, reporterRouter)

// Automatically allows campaign routes
app.use("/api/campaign", commonAuth, campaignRouter)

// Automatically allows api routes
app.use("/api/api", commonAuth, apiRouter)

// Automatically allows banner routes
app.use("/api/banner", commonAuth, bannerRouter)

// Automatically allows price impact routes
app.use("/api/price-impact", commonAuth, priceImpactRouter)

// Automatically allows front end session routes
app.use("/api", miscRouter)

// Automatically allows oauth routes
app.use("/api/oauth", oauthRouter)

// Automatically allows 404 routes
app.use(_404Router)

// Listening Server
server.listen(port, () => {
  console.log(chalk.hex('#009e00')(`Server started successfully on port ${port}`));
  console.log(chalk.cyanBright(`Server time: ${format(new Date(), "d/MM/yyyy - hh:mmaaa")}`));
})
