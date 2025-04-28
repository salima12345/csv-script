#!/usr/bin/env node
import { program } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { importArchitects } from './src/importArchitects.js';
import { importBuildings } from './src/importBuildings.js';
import { fileExists } from './src/utils/fileUtils.js';

// Load environment variables
dotenv.config();

// Display app header
console.log(
  chalk.blue(
    figlet.textSync('CSV to WP', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  )
);
console.log(chalk.green('Architecture Data Importer for WordPress\n'));

// Setup CLI options
program
  .version('1.0.0')
  .description('Import architects and buildings data from CSV files to WordPress')
  .option('-t, --type <type>', 'Type of import: architects, buildings, or all', 'all')
  .option('-f, --file <file>', 'Path to CSV file (overrides default in .env)')
  .option('-d, --dry-run', 'Validate data without importing', false)
  .parse(process.argv);

const options = program.opts();

async function run() {
  try {
    // Validate environment variables
    if (!process.env.WP_API_URL) {
      console.error(chalk.red('Error: WP_API_URL is not defined in .env file'));
      process.exit(1);
    }
    
    if (!process.env.WP_API_USERNAME || !process.env.WP_API_PASSWORD) {
      console.error(chalk.red('Error: WordPress API credentials are not defined in .env file'));
      process.exit(1);
    }

    // Determine which imports to run
    const runArchitects = options.type === 'all' || options.type === 'architects';
    const runBuildings = options.type === 'all' || options.type === 'buildings';
    
    // Import architects if requested
    if (runArchitects) {
      const architectsFile = options.file || process.env.ARCHITECTS_CSV || './data/architects.csv';
      
      if (!await fileExists(architectsFile)) {
        console.error(chalk.red(`Error: Architects CSV file not found at ${architectsFile}`));
        if (options.type === 'architects') process.exit(1);
      } else {
        await importArchitects(architectsFile, options.dryRun);
      }
    }

    // Import buildings if requested
    if (runBuildings) {
      const buildingsFile = options.file || process.env.BUILDINGS_CSV || './data/buildings.csv';
      
      if (!await fileExists(buildingsFile)) {
        console.error(chalk.red(`Error: Buildings CSV file not found at ${buildingsFile}`));
        if (options.type === 'buildings') process.exit(1);
      } else {
        await importBuildings(buildingsFile, options.dryRun);
      }
    }

    console.log(chalk.green.bold('\nImport process completed!'));
  } catch (error) {
    console.error(chalk.red('Error during import:'), error.message);
    process.exit(1);
  }
}

// Run the program
run();