import chalk from "chalk";

export const logger = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(chalk.green(`✓ ${msg}`)),
  warning: (msg: string) => console.log(chalk.yellow(`! ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`✗ ${msg}`)),
  progress: (msg: string) => console.log(chalk.dim(`→ ${msg}`)),
  milestone: (msg: string) => console.log(chalk.cyan(`★ ${msg}`)),
};
