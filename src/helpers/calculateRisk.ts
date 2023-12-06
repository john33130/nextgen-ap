import { DeviceMeasurements } from '../types';

/**
 * Calculate the risk of swimming
 * @param measurement - The measurements
 */

export function calculateRisk(measurement: Omit<DeviceMeasurements, 'risk'>): RiskLevel {
	// determine if all values are present
	const { tds, waterTemperature, turbidity, ph } = measurement;
	if (tds === undefined || waterTemperature === undefined || turbidity === undefined || ph === undefined)
		return 'UNKNOWN';

	// calculate score
	let score = 0;

	// tds
	if (tds > 2500) score += 2; // HIGH
	if (tds >= 1500 && tds <= 2500) score += 1; // MODERATE
	if (tds < 1500) score += 0; // LOW

	// turbidity
	if (turbidity > 400) score += 3; // HIGH
	if (turbidity >= 50 && tds <= 400) score += 2; // MODERATE
	if (turbidity < 50) score += 1; // LOW

	// water temperature
	if (waterTemperature < 12) score += 6; // HIGH
	if (waterTemperature >= 12 && waterTemperature <= 16) score += 3; // MODERATE
	if (waterTemperature > 16) score += 1; // LOW

	// ph
	if (ph < 7 || ph > 8) score += 5; // HIGH
	if ((ph >= 7 && ph <= 7.2) || (ph >= 7.8 && ph <= 8)) score += 3; // MODERATE
	if (ph >= 7.2 && ph <= 7.8) score += 1; // LOW

	// determine risk
	let risk: RiskLevel = 'UNKNOWN';
	if (score > 10) risk = 'HIGH';
	if (score >= 6 && score <= 10) risk = 'MODERATE';
	if (score < 6) risk = 'LOW';

	return risk;
}
