import axios from 'axios';
import chalk from 'chalk';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

export async function importBuildings(csvFilePath, dryRun = false) {
  try {
    // 1. Read the CSV
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const buildings = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    console.log(chalk.green(`✓ Parsed ${buildings.length} buildings from CSV`));

    // 2. Simple validation
    buildings.forEach(building => {
      if (!building.name) throw new Error(`Missing name: ${JSON.stringify(building)}`);
      building.name = String(building.name).trim();
    });
    console.log(chalk.green(`✓ All buildings data is valid`));

    // 3. Fetch architects for reference
    const architectsResponse = await axios.get(
      `${process.env.WP_API_URL}/morocco-architecture/v1/architects`
    );
    const architects = architectsResponse.data;
    console.log(chalk.green(`✓ Found ${architects.length} architects for reference`));

    // 4. Get existing buildings
    const existingResponse = await axios.get(
      `${process.env.WP_API_URL}/morocco-architecture/v1/buildings`
    );
    const existingBuildings = existingResponse.data;
    console.log(chalk.green(`✓ Found ${existingBuildings.length} existing buildings`));

    // 5. Import data
    let created = 0, updated = 0, skipped = 0, errors = 0;
    console.log(chalk.blue(`⠋ Importing ${buildings.length} buildings...`));
    
    for (const building of buildings) {
      try {
        if (dryRun) {
          skipped++;
          continue;
        }

        // Find architect by name
        const architect = architects.find(a => 
          a.name && building.architect_name && 
          a.name.toLowerCase() === building.architect_name.toLowerCase()
        );

        // Prepare images as JSON array
        let imagesArray = [];
        if (building.images) {
          imagesArray = building.images.split(',').map(url => url.trim());
        }

        // Prepare position data
        const position = {
          lat: parseFloat(building.latitude) || 0,
          lng: parseFloat(building.longitude) || 0
        };

        // Format data for our API - CORRECTED WITH UNDERSCORE PREFIXES
        const postData = {
          title: building.name,
          status: 'publish',
          _building_name: building.name,
          _building_description: building.description || '',
          _building_year_built: building.year_built || '',
          _building_architect_id: architect ? architect.id : '',
          _building_city: building.city || '',
          _building_region: building.region || '',
          _building_images: JSON.stringify(imagesArray),
          _building_position: JSON.stringify(position)
        };

        // Log the data being sent
        console.log(chalk.blue(`Sending data for ${building.name}:`));
        console.log(JSON.stringify(postData, null, 2));

        // Find existing building by name
        const existing = existingBuildings.find(b => 
          b.name && building.name && 
          b.name.toLowerCase() === building.name.toLowerCase()
        );

        if (existing) {
          const response = await axios.put(
            `${process.env.WP_API_URL}/morocco-architecture/v1/buildings/${existing.id}`,
            postData
          );
          console.log(chalk.green(`Updated building response status: ${response.status}`));
          updated++;
        } else {
          const response = await axios.post(
            `${process.env.WP_API_URL}/morocco-architecture/v1/buildings`,
            postData
          );
          console.log(chalk.green(`Created building response status: ${response.status}`));
          console.log(JSON.stringify(response.data, null, 2)); // Log the response data
          created++;
        }
      } catch (error) {
        errors++;
        console.log(chalk.red(`Error importing building ${building.name}: ${error.message}`));
        if (error.response) {
          console.log(chalk.red(`Status: ${error.response.status}`));
          console.log(chalk.red(`Response data: ${JSON.stringify(error.response.data, null, 2)}`));
        }
      }
    }

    // 6. Summary
    console.log(chalk.green(`✓ Buildings import completed`));
    console.log(chalk.bold('\nImport Summary:'));
    console.log(`- Created: ${created}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Errors: ${errors}`);
    return { created, updated, skipped, errors };
  } catch (error) {
    console.log(chalk.red('Total failure:'), error.message);
    throw error;
  }
}

// If this file is run directly (not imported)
if (import.meta.url === import.meta.main) {
  const args = process.argv.slice(2);
  const csvPath = args[0];
  const dryRun = args.includes('--dry-run');

  if (!csvPath) {
    console.log(chalk.red('Usage: node buildingImporter.js path/to/buildings.csv [--dry-run]'));
    process.exit(1);
  }

  importBuildings(csvPath, dryRun)
    .then(() => console.log(chalk.green('Import process completed!')))
    .catch((err) => {
      console.error(chalk.red('Import failed:'), err);
      process.exit(1);
    });
}