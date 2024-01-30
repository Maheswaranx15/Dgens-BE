import mongoose from 'mongoose'
import chalk from 'chalk'
const connectionString: any = process.env.MONGODB_URL

// Connect Mongo Database
const setDatabase = async (connectionString: string) => {
  let time = 1
  while (true) {
    console.log(chalk.yellow('Connecting to Database...'));
    try {
      await mongoose.connect(connectionString)
      console.log(chalk.hex('#009e00')(`Database Connected Succesfully`));
      break;
    } catch (error) {
      console.log(chalk.hex('#ea7b4b')(`Database Connection Failed. Attempting reconnection in ${time}s...`));
      await new Promise(resolve => setTimeout(resolve, 1000 * time))
      continue;
    } finally {
      time = time + 2
    }
  }
}
setDatabase(connectionString)