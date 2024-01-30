import passport from 'passport';
import express from 'express';
import { authReporterRequest } from '../controllers/controllerTypes';
import { errorJson } from '../middleware/errors';
import { Response } from '../controllers/controllerTypes';
import oauthAuth from '../middleware/oauthAuth';

const router = express.Router();

router.get('/discord/callback', function (req, res, next) {
  passport.authenticate('discord', function (err: any, reporter: any, info: any) {

    if (err) {
      return res.send(`
      <html>
        <head>
          <title>Degen News - Discord</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
        </head>
        <body style="
          background-color: #222;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          font-family: 'Poppins';
          color: #fff;
        ">
          <h1 style="margin: 0; color: #ff9b9b;">${err?.message ? err.message : "An Error Occured"}</h1>
          <p>This window will close in three seconds</p>
          <script>setTimeout(() => {window.close()}, 3000)</script>
        </body>
      </html>
    `);

    } else if (reporter?.profile) {
      return res.send(`
        <html>
          <head>
            <title>Degen News - Discord</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
          </head>
          <body style="
            background-color: #222;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: 'Poppins';
            color: #fff;
          ">
            <h1 style="margin: 0; color: #88eac1;">Discord Connected</h1>
            <p>This window will close in three seconds</p>
            <script>setTimeout(() => {window.close()}, 3000)</script>
          </body>
        </html>
      `);
    }

    return res.send(`
      <html>
        <head>
          <title>Degen News - Discord</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
        </head>
        <body style="
          background-color: #222;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          font-family: 'Poppins';
          color: #fff;
        ">
          <h1 style="margin: 0; color: #9d9dff;">${info?.message ? info.message : "Something Happened"}</h1>
          <p>This window will close in three seconds</p>
          <script>setTimeout(() => {window.close()}, 3000)</script>
        </body>
      </html>
    `);
  })(req, res, next);
})

// protected route that authenticate reporter and configures discord
router.get('/discord', oauthAuth, (req: authReporterRequest, res: Response, next) => {
  if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

  passport.authenticate('discord', {
    state: JSON.stringify({ reporterID: req.reporter._id }),
  })(req, res, next);
});


router.get('/twitter/callback', function (req, res, next) {
  passport.authenticate('twitter', function (err: any, reporter: any, info: any) {
    if (err) {
      return res.send(`
      <html>
        <head>
          <title>Degen News - Twitter</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
        </head>
        <body style="
          background-color: #222;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          font-family: 'Poppins';
          color: #fff;
        ">
          <h1 style="margin: 0; color: #ff9b9b;">${err?.message ? err.message : "An Error Occured"}</h1>
          <p>This window will close in three seconds</p>
          <script>setTimeout(() => {window.close()}, 3000)</script>
        </body>
      </html>
    `);

    } else if (reporter?.profile) {
      return res.send(`
        <html>
          <head>
            <title>Degen News - Twitter</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
          </head>
          <body style="
            background-color: #222;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: 'Poppins';
            color: #fff;
          ">
            <h1 style="margin: 0; color: #88eac1;">Twitter Connected</h1>
            <p>This window will close in three seconds</p>
            <script>setTimeout(() => {window.close()}, 3000)</script>
          </body>
        </html>
      `);
    }

    return res.send(`
      <html>
        <head>
          <title>Degen News - Twitter</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet">
        </head>
        <body style="
          background-color: #222;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          font-family: 'Poppins';
          color: #fff;
        ">
          <h1 style="margin: 0; color: #9d9dff;">${info?.message ? info.message : "Something Happened"}</h1>
          <p>This window will close in three seconds</p>
          <script>setTimeout(() => {window.close()}, 3000)</script>
        </body>
      </html>
    `);
  })(req, res, next);
})

// protected route that authenticate reporter and configures twitter
router.get('/twitter', oauthAuth, (req: authReporterRequest, res: Response, next) => {
  if (!req.reporter || !req.token) return errorJson(res, 401, "Not Logged In")

  // @ts-ignore
  passport.authenticate('twitter', {
    state: JSON.stringify({ reporterID: req.reporter._id }),
    passReqToCallback: true,
    callbackURL: `${process.env.HOST}/api/oauth/twitter/callback?reporterID=` + req.reporter._id,
  })(req, res, next);

});

export default router