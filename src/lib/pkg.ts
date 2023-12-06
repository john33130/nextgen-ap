import { readFileSync } from 'fs';
import { PackageJson } from 'pkg-types';

export default ((): PackageJson => JSON.parse(readFileSync('./package.json', { encoding: 'utf8' })) as PackageJson)();
