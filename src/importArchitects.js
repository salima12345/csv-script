import axios from 'axios';
import chalk from 'chalk';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

export async function importArchitects(csvFilePath, dryRun = false) {
  try {
    // 1. Lire le CSV
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const architects = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    console.log(chalk.green(`✔ ${architects.length} architectes trouvés dans le CSV`));

    // 2. Validation simple
    architects.forEach(architect => {
      if (!architect.name) throw new Error(`Nom manquant: ${JSON.stringify(architect)}`);
      architect.name = String(architect.name).trim();
    });

    // 3. Récupérer les existants - Using custom endpoint
    const existingResponse = await axios.get(
      `${process.env.WP_API_URL}/morocco-architecture/v1/architects`
    );
    const existingArchitects = existingResponse.data;

    // 4. Importer les données
    let created = 0, updated = 0, skipped = 0, errors = 0;
    for (const [index, architect] of architects.entries()) {
      try {
        console.log(chalk.blue(`Importation ${index + 1}/${architects.length}: ${architect.name}`));
        if (dryRun) {
          skipped++;
          continue;
        }

        // Format data for our custom endpoint
        const postData = {
          title: architect.name,
          status: 'publish',
          architect_name: architect.name,
          architect_description: architect.description || '',
          architect_image_url: architect.image_url || '',
          // Parse the education and office_locations if they are JSON strings
          architect_education: architect.education || '{}',
          architect_office_locations: architect.office_locations || '{}'
        };

        // Find existing architect by name instead of title.rendered
        const existing = existingArchitects.find(a => 
          a.name.toLowerCase() === architect.name.toLowerCase()
        );

        // Use custom endpoints for POST/PUT
        if (existing) {
          await axios.put(
            `${process.env.WP_API_URL}/morocco-architecture/v1/architects/${existing.id}`,
            postData
          );
          updated++;
        } else {
          await axios.post(
            `${process.env.WP_API_URL}/morocco-architecture/v1/architects`,
            postData
          );
          created++;
        }
        console.log(chalk.green(` → Succès (${existing ? 'MàJ' : 'Création'})`));
      } catch (error) {
        errors++;
        console.log(chalk.red(` → Erreur: ${error.message}`));
        if (error.response) {
          console.log(chalk.red(`   Status: ${error.response.status}`));
          console.log(chalk.red(`   Data: ${JSON.stringify(error.response.data)}`));
        }
      }
    }

    // 5. Résumé
    console.log(chalk.bold('\nRésultat:'));
    console.log(chalk.green(`- Créés: ${created}`));
    console.log(chalk.yellow(`- Mis à jour: ${updated}`));
    console.log(chalk.blue(`- Ignorés: ${skipped}`));
    console.log(chalk.red(`- Erreurs: ${errors}`));
  } catch (error) {
    console.log(chalk.red('Échec total:'), error.message);
    throw error;
  }
}

// If this file is run directly (not imported)
if (import.meta.url === import.meta.main) {
  const args = process.argv.slice(2);
  const csvPath = args[0];
  const dryRun = args.includes('--dry-run');

  if (!csvPath) {
    console.log(chalk.red('Usage: node script.js path/to/architects.csv [--dry-run]'));
    process.exit(1);
  }

  importArchitects(csvPath, dryRun)
    .then(() => console.log(chalk.green('Import process completed!')))
    .catch((err) => {
      console.error(chalk.red('Import failed:'), err);
      process.exit(1);
    });
}