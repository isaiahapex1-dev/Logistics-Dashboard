// Google Sheets API integration
const HELIUM_SHEET_ID = '1rLsFurA_11kYc2WXXfIwOOojLaNHiJtvh36V6IvdhEg';
const FUEL_SHEET_ID = '1O4tQHwdFtdTEsIOTThXHAgDopkYNv9AZcNNXtHXacD8';

const HELIUM_RANGE = 'Sheet1!A:H';
const FUEL_RANGE = 'Sheet1!A:F';

export interface HeliumData {
  date: string;
  location: string;
  quantity: number;
  cost: number;
  supplier: string;
  status: string;
  notes: string;
}

export interface FuelData {
  date: string;
  vehicle: string;
  fuelType: string;
  quantity: number;
  cost: number;
  mileage: number;
}

export async function fetchHeliumData(): Promise<HeliumData[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${HELIUM_SHEET_ID}/export?format=csv&range=${HELIUM_RANGE}`;
    const response = await fetch(url);
    const csv = await response.text();
    
    const lines = csv.split('\n').slice(1); // Skip header
    return lines
      .filter(line => line.trim())
      .map(line => {
        const [date, location, quantity, cost, supplier, status, notes] = line.split(',');
        return {
          date: date?.trim() || '',
          location: location?.trim() || '',
          quantity: parseFloat(quantity) || 0,
          cost: parseFloat(cost) || 0,
          supplier: supplier?.trim() || '',
          status: status?.trim() || '',
          notes: notes?.trim() || '',
        };
      });
  } catch (error) {
    console.error('Error fetching Helium data:', error);
    return [];
  }
}

export async function fetchFuelData(): Promise<FuelData[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${FUEL_SHEET_ID}/export?format=csv&range=${FUEL_RANGE}`;
    const response = await fetch(url);
    const csv = await response.text();
    
    const lines = csv.split('\n').slice(1); // Skip header
    return lines
      .filter(line => line.trim())
      .map(line => {
        const [date, vehicle, fuelType, quantity, cost, mileage] = line.split(',');
        return {
          date: date?.trim() || '',
          vehicle: vehicle?.trim() || '',
          fuelType: fuelType?.trim() || '',
          quantity: parseFloat(quantity) || 0,
          cost: parseFloat(cost) || 0,
          mileage: parseFloat(mileage) || 0,
        };
      });
  } catch (error) {
    console.error('Error fetching Fuel data:', error);
    return [];
  }
}

export async function fetchCombinedData() {
  const [helium, fuel] = await Promise.all([
    fetchHeliumData(),
    fetchFuelData(),
  ]);
  
  return { helium, fuel };
}
