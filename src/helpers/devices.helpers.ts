import { Device } from '@prisma/client';
import { DeviceCredentials, DeviceWithoutSensitiveData, RiskLevel } from '../types';

/**
 * Remove sensitive data from a user object
 * @param body - The user object
 */
export function removeSensitiveDataFromDevice(body: Device | DeviceCredentials): DeviceWithoutSensitiveData {
	const data: Partial<Device> = body;
	delete data.accessKey;
	return data as DeviceWithoutSensitiveData;
}

export function getDeviceCredentials(body: Device): DeviceCredentials {
	const data: Partial<Device> = body;
	delete data.ph;
	delete data.tds;
	delete data.waterTemperature;
	delete data.turbidity;
	delete data.risk;
	delete data.coordinates;
	delete data.batteryLevel;
	delete data.updatedAt;
	return data as DeviceCredentials;
}

/**
 * Calculate the risk of swimming
 * @param measurement - The measurements
 */
export function calculateRisk(
	tds?: number | null,
	temp?: number | null,
	turbidity?: number | null,
	ph?: number | null
): RiskLevel {
	// determine if all values are present
	if (!tds || !temp || !turbidity || !ph) return 'UNKNOWN';

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
	if (temp < 12) score += 6; // HIGH
	if (temp >= 12 && temp <= 16) score += 3; // MODERATE
	if (temp > 16) score += 1; // LOW

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
