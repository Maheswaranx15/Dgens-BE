import passport from 'passport';
import Reporter from '../models/Reporter';
import passportTwitter from 'passport-twitter';

passport.use(
	new passportTwitter.Strategy(
		{
			consumerKey: process.env.TWITTER_CLIENT_ID as string,
			consumerSecret: process.env.TWITTER_CLIENT_SECRET as string,
			callbackURL: `${process.env.HOST}/api/oauth/twitter/callback`,
			passReqToCallback: true,
		},
		async function (req, accessToken, refreshToken, profile, done) {
			try {
				const reporterID = req.query.reporterID
				if (typeof reporterID !== "string") return done(new Error("Invalid reporterID"))

				const reporter = await Reporter.findById(reporterID);
				if (!reporter) return done(new Error("Reporter does not exist"))

				reporter.twitterID = profile.id;
				reporter.twitter = profile.username;

				await reporter.save();
				return done(null, { profile, reporter });
			} catch (e) { return done(e as any) }
		}
	)
);

passport.serializeUser(function (user, done) {
	done(null, user as any);
});
passport.deserializeUser(function (user, done) {
	done(null, user as any);
});

module.exports = passport;
