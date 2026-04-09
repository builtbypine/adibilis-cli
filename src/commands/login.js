import { createInterface } from 'node:readline';
import chalk from 'chalk';
import { saveApiKey, getBaseUrl } from '../api.js';

export async function loginCommand() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const apiKey = await new Promise((resolve) => {
    rl.question('  Enter your Adibilis API key: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!apiKey) {
    console.log(chalk.red('  \u2718 No API key provided.'));
    process.exit(1);
  }

  // Validate the key against the API
  try {
    const res = await fetch(`${getBaseUrl()}/scans/usage`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.log(chalk.red('  \u2718 Invalid API key. Please check and try again.'));
      process.exit(1);
    }

    const data = await res.json();
    saveApiKey(apiKey);

    console.log(chalk.green(`  \u2714 Authenticated (${data.plan || 'free'} plan)`));
    console.log(chalk.dim('  Key saved to ~/.adibilis/config.json'));
  } catch (err) {
    console.log(chalk.red(`  \u2718 Could not connect to Adibilis API: ${err.message}`));
    process.exit(1);
  }
}
