import chalk from 'chalk';
import Twitter from 'twitter'
// 1659879284348170240

var client = new Twitter({
	consumer_key: process.env.TWITTER_API_KEY as string,
	consumer_secret: process.env.TWITTER_API_SECRET as string,
	// bearer_token: process.env.TWITTER_BEARER_TOKEN as string
	access_token_key: process.env.TWITTER_ACCESS_TOKEN as string,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET as string,
});


const twitter = async () => {
	client.get('search/tweets', { q: 'node.js' }, function (error, tweets, response) {
		if (error) console.log(chalk.hex('#ea7b4b')(`Twitter check failed`))
		else console.log(chalk.hex('#009e00')(`Twitter check passed`));
	});
};

export default twitter