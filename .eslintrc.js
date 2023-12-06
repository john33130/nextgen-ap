const sharedRules = {
	'no-return-assign': 0,
	'no-param-reassign': 0,
	'no-plusplus': 0,
	'import/prefer-default-export': 0,
	'no-new': 0,
	'import/no-cycle': 0,
};

module.exports = {
	extends: ['airbnb-base', 'eslint-config-prettier'],
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: './tsconfig.json',
	},
	overrides: [
		{
			files: '*.ts',
			extends: ['airbnb-base', 'eslint-config-airbnb-typescript/base', 'eslint-config-prettier'],
			rules: {
				...sharedRules,
			},
		},
	],
	rules: {
		...sharedRules,
	},
};
