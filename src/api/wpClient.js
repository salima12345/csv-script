import axios from 'axios';
import FormData from 'form-data';
import chalk from 'chalk';

// Create a WordPress API client with authentication
export const createWpClient = () => {
  const apiUrl = process.env.WP_API_URL;
  const username = process.env.WP_API_USERNAME;
  const password = process.env.WP_API_PASSWORD;
  
  // Create Axios instance
  const client = axios.create({
    baseURL: apiUrl,
    timeout: 30000, // 30 seconds
  });
  
  // Add authentication
  client.interceptors.request.use(async (config) => {
    // Set Basic Auth
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    config.headers['Authorization'] = `Basic ${credentials}`;
    return config;
  });
  
  return {
    // Get existing data from WordPress
    async getArchitects() {
      try {
        const endpoint = `/${process.env.ARCHITECTS_ENDPOINT || 'morocco-architecture/v1/architects'}`;
        const response = await client.get(endpoint);
        return response.data;
      } catch (error) {
        console.error(chalk.red('Error fetching architects:'), error.message);
        return [];
      }
    },
    
    async getBuildings() {
      try {
        const endpoint = `/${process.env.BUILDINGS_ENDPOINT || 'morocco-architecture/v1/buildings'}`;
        const response = await client.get(endpoint);
        return response.data;
      } catch (error) {
        console.error(chalk.red('Error fetching buildings:'), error.message);
        return [];
      }
    },
    
    // Create new entities
    async createArchitect(architectData) {
      try {
        const response = await client.post('/wp/v2/architect', {
          title: architectData.name,
          status: 'publish',
          meta: {
            _architect_name: architectData.name,
            _architect_image_url: architectData.image_url,
            _architect_description: architectData.description,
            _architect_education: JSON.stringify(architectData.education),
            _architect_office_locations: JSON.stringify(architectData.office_locations)
          }
        });
        
        return response.data;
      } catch (error) {
        console.error(chalk.red(`Error creating architect ${architectData.name}:`), error.message);
        throw error;
      }
    },
    
    async createBuilding(buildingData) {
      try {
        const response = await client.post('/wp/v2/building', {
          title: buildingData.name,
          status: 'publish',
          meta: {
            _building_name: buildingData.name,
            _building_images: JSON.stringify(buildingData.images),
            _building_year_built: buildingData.year_built,
            _building_architect_id: buildingData.architect_id,
            _building_city: buildingData.city,
            _building_region: buildingData.region,
            _building_description: buildingData.description,
            _building_position: JSON.stringify(buildingData.position)
          }
        });
        
        return response.data;
      } catch (error) {
        console.error(chalk.red(`Error creating building ${buildingData.name}:`), error.message);
        throw error;
      }
    },
    
    // Update existing entities
    async updateArchitect(id, architectData) {
      try {
        const response = await client.put(`/wp/v2/architect/${id}`, {
          meta: {
            _architect_name: architectData.name,
            _architect_image_url: architectData.image_url,
            _architect_description: architectData.description,
            _architect_education: JSON.stringify(architectData.education),
            _architect_office_locations: JSON.stringify(architectData.office_locations)
          }
        });
        
        return response.data;
      } catch (error) {
        console.error(chalk.red(`Error updating architect ${architectData.name}:`), error.message);
        throw error;
      }
    },
    
    async updateBuilding(id, buildingData) {
      try {
        const response = await client.put(`/wp/v2/building/${id}`, {
          meta: {
            _building_name: buildingData.name,
            _building_images: JSON.stringify(buildingData.images),
            _building_year_built: buildingData.year_built,
            _building_architect_id: buildingData.architect_id,
            _building_city: buildingData.city,
            _building_region: buildingData.region,
            _building_description: buildingData.description,
            _building_position: JSON.stringify(buildingData.position)
          }
        });
        
        return response.data;
      } catch (error) {
        console.error(chalk.red(`Error updating building ${buildingData.name}:`), error.message);
        throw error;
      }
    }
  };
};