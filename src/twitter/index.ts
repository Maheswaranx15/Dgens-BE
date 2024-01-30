import Twitter from "twitter"

var client = new Twitter({
	consumer_key: process.env.TWITTER_CLIENT_ID ?? "",
	consumer_secret: process.env.TWITTER_CLIENT_SECRET ?? "",
	bearer_token: process.env.TWITTER_BEARER_TOKEN ?? ""
});

var params = { screen_name: 'nodejs' };
export const testTwitter = () => client.get('statuses/user_timeline', params, function (error, tweets, response) {
	if (!error) console.log("Twitter Successful");
	else console.log("Twitter Failed")
});