import chalk from 'chalk';
import { writeDefaultConfig } from '../config.js';

export async function initCommand() {
  try {
    const filePath = writeDefaultConfig();
    console.log(chalk.green(`  \u2714 Created ${filePath}`));
    console.log(chalk.dim('  Edit this file to customize your accessibility scanning.'));
  } catch (err) {
    console.log(chalk.red(`  \u2718 Failed to create config: ${err.message}`));
    process.exit(1);
  }
}
