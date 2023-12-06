import { join } from 'path';

/**
 * Returns the absolute filepath with in the working directory
 * @param filepath - The path to the desired location
 */
export function path(...filepath: string[]) {
	return join(__dirname, '../', ...filepath);
}
