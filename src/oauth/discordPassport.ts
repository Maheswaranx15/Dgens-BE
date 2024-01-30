import passport from 'passport';
import Reporter from '../models/Reporter';
import passportDiscord from 'passport-discord';
// import asyncHandler from "express-async-handler";


passport.use(
	new passportDiscord.Strategy(
		{
			clientID: process.env.DISCORD_CLIENT_ID as string,
			clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
			callbackURL: `${process.env.HOST}/api/oauth/discord/callback`,
			passReqToCallback: true,
			scope: ['identify', 'guilds'],
		},
		async (req, accessToken, refreshToken, profile, done) => {

			try {
				const state = req.query.state
				if (typeof state !== "string") return done(new Error("Invalis state"))
				const reporterID = JSON.parse(state).reporterID;

				const reporter = await Reporter.findById(reporterID);
				if (!reporter) return done(new Error("Reporter does not exist"))

				reporter.discordID = profile.id;
				reporter.discord = profile.username + '#' + profile.discriminator;
				await reporter.save();

				return done(null, { profile, reporter });
			} catch (e) { return done(e as any) }
		})
);

passport.serializeUser(function (user, done) {
	done(null, user);
});
passport.deserializeUser(function (user, done) {
	done(null, user as any);
});

export default passport