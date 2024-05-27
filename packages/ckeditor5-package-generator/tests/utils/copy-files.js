/**
 * @license Copyright (c) 2020-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const { expect } = require( 'chai' );

describe( 'lib/utils/copy-files', () => {
	let stubs, options, copyFiles;

	const packageJson = {
		'name': '<%= packageName %>',
		'license': 'MIT',
		'dependencies': {
			'ckeditor5': '>=<%= packageVersions.ckeditor5 %>'
		},
		'devDependencies': {
			'@ckeditor/ckeditor5-dev-build-tools': '<%= packageVersions.ckeditor5DevBuildTools %>',
			'@ckeditor/ckeditor5-autoformat': '>=<%= packageVersions.ckeditor5 %>',
			'@ckeditor/ckeditor5-basic-styles': '>=<%= packageVersions.ckeditor5 %>',
			'@ckeditor/ckeditor5-block-quote': '>=<%= packageVersions.ckeditor5 %>',
			'@ckeditor/ckeditor5-inspector': '>=<%= packageVersions.ckeditor5Inspector %>',
			'@ckeditor/ckeditor5-package-tools': '<%= packageVersions.packageTools %>',
			'eslint': '^7.32.0',
			'eslint-config-ckeditor5': '>=<%= packageVersions.eslintConfigCkeditor5 %>',
			'stylelint': '^13.13.1',
			'stylelint-config-ckeditor5': '>=<%= packageVersions.stylelintConfigCkeditor5 %>'
		},
		'scripts': {
			'dll:build': 'ckeditor5-package-tools dll:build',
			'prepare': '<%= packageManager %> run dll:build',
			'prepublishOnly': '<%= packageManager %> run dll:build'
		}
	};

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		// 'lodash.template' is not stubbed for more realistic tests.

		sinon.useFakeTimers( {
			now: new Date( 1984, 1, 1, 0, 0 ),
			shouldAdvanceTime: true,
			toFake: [ 'Date' ]
		} );

		stubs = {
			logger: {
				process: sinon.stub(),
				verboseInfo: sinon.stub()
			},
			chalk: {
				gray: sinon.stub().callsFake( str => str )
			},
			fs: {
				writeFileSync: sinon.stub(),
				readFileSync: sinon.stub()
			},
			glob: {
				sync: sinon.stub()
			},
			mkdirp: {
				sync: sinon.stub().callsFake( str => str )
			},
			path: {
				sep: '/',
				// This replace() removes the ( __dirname, '..' ) part from the path.
				join: sinon.stub().callsFake( ( ...args ) => args.join( '/' ).replace( /^.+\.\.\//, '' ) ),
				dirname: sinon.stub()
			}
		};

		stubs.glob.sync.withArgs( 'common/**/*' ).returns( [
			'common/LICENSE.md',
			'common/lang/contexts.json'
		] );
		stubs.glob.sync.withArgs( 'js/**/*' ).returns( [
			'js/package.json',
			'js/src/index.js'
		] );
		stubs.glob.sync.withArgs( 'ts/**/*' ).returns( [
			'ts/package.json',
			'ts/src/index.ts'
		] );
		stubs.glob.sync.withArgs( 'js-legacy/**/*' ).returns( [
			'js/package.json',
			'js/src/index.js'
		] );
		stubs.glob.sync.withArgs( 'ts-legacy/**/*' ).returns( [
			'ts/package.json',
			'ts/src/index.ts'
		] );

		stubs.fs.readFileSync.withArgs( 'templates/common/LICENSE.md', 'utf-8' ).returns(
			'Copyright (c) <%= now.getFullYear() %>. All rights reserved.\n'
		);
		stubs.fs.readFileSync.withArgs( 'templates/common/lang/contexts.json', 'utf-8' ).returns(
			JSON.stringify( { 'My plugin': 'Content for a tooltip is displayed when a user hovers the CKEditor 5 icon.' }, null, 2 )
		);
		stubs.fs.readFileSync.withArgs( 'templates/js/package.json', 'utf-8' ).returns(
			JSON.stringify( packageJson, null, 2 )
		);
		stubs.fs.readFileSync.withArgs( 'templates/ts/package.json', 'utf-8' ).returns(
			JSON.stringify( packageJson, null, 2 )
		);
		stubs.fs.readFileSync.withArgs( 'templates/js/src/index.js', 'utf-8' ).returns( '/* JS CODE */' );
		stubs.fs.readFileSync.withArgs( 'templates/ts/src/index.ts', 'utf-8' ).returns( '/* TS CODE */' );
		stubs.fs.readFileSync.withArgs( 'templates/js/src/_PLACEHOLDER_.js', 'utf-8' ).returns( '/* PLACEHOLDER JS CODE */' );
		stubs.fs.readFileSync.withArgs( 'templates/js/src/foo.js.txt', 'utf-8' ).returns( '/* JS CODE IN TXT FILE */' );

		mockery.registerMock( 'chalk', stubs.chalk );
		mockery.registerMock( 'fs', stubs.fs );
		mockery.registerMock( 'glob', stubs.glob );
		mockery.registerMock( 'mkdirp', stubs.mkdirp );
		mockery.registerMock( 'path', stubs.path );

		options = {
			packageName: '@foo/ckeditor5-featurename',
			programmingLanguage: 'js',
			formattedNames: {
				package: {
					raw: 'featurename',
					spacedOut: 'Featurename',
					camelCase: 'featurename',
					pascalCase: 'Featurename',
					lowerCaseMerged: 'featurename'
				},
				plugin: {
					raw: 'BarBaz',
					spacedOut: 'Bar baz',
					camelCase: 'barBaz',
					pascalCase: 'BarBaz',
					lowerCaseMerged: 'barbaz'
				}
			},
			packageManager: 'yarn',
			directoryPath: 'directory/path/foo',
			packageVersions: {
				ckeditor5DevBuildTools: '40.0.0',
				ckeditor5: '30.0.0',
				packageTools: '25.0.0'
			},
			dllConfiguration: {}
		};

		copyFiles = require( '../../lib/utils/copy-files' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
		sinon.restore();
	} );

	it( 'should be a function', () => {
		expect( copyFiles ).to.be.a( 'function' );
	} );

	it( 'logs the process', () => {
		copyFiles( stubs.logger, options );

		expect( stubs.logger.process.calledOnce ).to.equal( true );
		expect( stubs.logger.process.firstCall.firstArg ).to.equal( 'Copying files...' );
	} );

	it( 'creates files for JavaScript', () => {
		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/path/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/path/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/path/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/path/foo/src/index.js' );

		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 1 ] ).to.equal( [
			'Copyright (c) 1984. All rights reserved.',
			''
		].join( '\n' ) );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 1 ] ).to.equal( [
			'{',
			'  "My plugin": "Content for a tooltip is displayed when a user hovers the CKEditor 5 icon."',
			'}'
		].join( '\n' ) );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 1 ] ).to.equal( JSON.stringify( {
			'name': '@foo/ckeditor5-featurename',
			'license': 'MIT',
			'dependencies': {
				'ckeditor5': '>=30.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-dev-build-tools': '40.0.0',
				'@ckeditor/ckeditor5-autoformat': '>=30.0.0',
				'@ckeditor/ckeditor5-basic-styles': '>=30.0.0',
				'@ckeditor/ckeditor5-block-quote': '>=30.0.0',
				'@ckeditor/ckeditor5-inspector': '>=',
				'@ckeditor/ckeditor5-package-tools': '25.0.0',
				'eslint': '^7.32.0',
				'eslint-config-ckeditor5': '>=',
				'stylelint': '^13.13.1',
				'stylelint-config-ckeditor5': '>='
			},
			'scripts': {
				'dll:build': 'ckeditor5-package-tools dll:build',
				'prepare': 'yarn run dll:build',
				'prepublishOnly': 'yarn run dll:build'
			}
		}, null, 2 ) );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 1 ] ).to.equal( [
			'/* JS CODE */'
		].join( '\n' ) );
	} );

	it( 'creates files for TypeScript', () => {
		options.programmingLanguage = 'ts';

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/path/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/path/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/path/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/path/foo/src/index.ts' );

		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 1 ] ).to.equal( [
			'Copyright (c) 1984. All rights reserved.',
			''
		].join( '\n' ) );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 1 ] ).to.equal( [
			'{',
			'  "My plugin": "Content for a tooltip is displayed when a user hovers the CKEditor 5 icon."',
			'}'
		].join( '\n' ) );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 1 ] ).to.equal( JSON.stringify( {
			'name': '@foo/ckeditor5-featurename',
			'license': 'MIT',
			'dependencies': {
				'ckeditor5': '>=30.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-dev-build-tools': '40.0.0',
				'@ckeditor/ckeditor5-autoformat': '>=30.0.0',
				'@ckeditor/ckeditor5-basic-styles': '>=30.0.0',
				'@ckeditor/ckeditor5-block-quote': '>=30.0.0',
				'@ckeditor/ckeditor5-inspector': '>=',
				'@ckeditor/ckeditor5-package-tools': '25.0.0',
				'eslint': '^7.32.0',
				'eslint-config-ckeditor5': '>=',
				'stylelint': '^13.13.1',
				'stylelint-config-ckeditor5': '>='
			},
			'scripts': {
				'dll:build': 'ckeditor5-package-tools dll:build',
				'prepare': 'yarn run dll:build',
				'prepublishOnly': 'yarn run dll:build'
			}
		}, null, 2 ) );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 1 ] ).to.equal( [
			'/* TS CODE */'
		].join( '\n' ) );
	} );

	it( 'replaces placeholder filenames', () => {
		stubs.glob.sync.withArgs( 'js/**/*' ).returns( [
			'js/package.json',
			'js/src/index.js',
			'js/src/_PLACEHOLDER_.js'
		] );

		options.withoutLegacyMethods = true;

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 5 );
		expect( stubs.fs.writeFileSync.getCall( 4 ).args[ 0 ] ).to.equal( 'directory/path/foo/src/barbaz.js' );
		expect( stubs.fs.writeFileSync.getCall( 4 ).args[ 1 ] ).to.equal( [
			'/* PLACEHOLDER JS CODE */'
		].join( '\n' ) );
	} );

	it( 'removes ".txt" extension from filenames', () => {
		stubs.glob.sync.withArgs( 'js/**/*' ).returns( [
			'js/package.json',
			'js/src/index.js',
			'js/src/foo.js.txt'
		] );

		options.withoutLegacyMethods = true;

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 5 );
		expect( stubs.fs.writeFileSync.getCall( 4 ).args[ 0 ] ).to.equal( 'directory/path/foo/src/foo.js' );
		expect( stubs.fs.writeFileSync.getCall( 4 ).args[ 1 ] ).to.equal( [
			'/* JS CODE IN TXT FILE */'
		].join( '\n' ) );
	} );

	it( 'works correctly with path containing directory called "common"', () => {
		options.directoryPath = 'directory/common/foo';

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/common/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/common/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/common/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/common/foo/src/index.js' );
	} );

	it( 'works correctly with path containing directory called "js"', () => {
		options.directoryPath = 'directory/js/foo';

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/js/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/js/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/js/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/js/foo/src/index.js' );
	} );

	it( 'works correctly with path containing directory called "ts"', () => {
		options.directoryPath = 'directory/ts/foo';

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/ts/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/ts/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/ts/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/ts/foo/src/index.js' );
	} );

	it( 'works correctly with path containing directory called "js" with flag "--without-legacy-methods"', () => {
		options.directoryPath = 'directory/js/foo';
		options.withoutLegacyMethods = true;

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/js/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/js/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/js/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/js/foo/src/index.js' );
	} );

	it( 'works correctly with path containing directory called "ts" with flag "--without-legacy-methods"', () => {
		options.directoryPath = 'directory/ts/foo';
		options.withoutLegacyMethods = true;

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/ts/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/ts/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/ts/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/ts/foo/src/index.js' );
	} );

	it( 'works correctly with path containing directory called "Projects" (it ends with "ts")', () => {
		options.directoryPath = 'directory/Projects/foo';

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/Projects/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/Projects/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/Projects/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/Projects/foo/src/index.js' );
	} );

	it( 'works with npm instead of yarn', () => {
		options.packageManager = 'npm';

		copyFiles( stubs.logger, options );

		expect( stubs.fs.writeFileSync.callCount ).to.equal( 4 );
		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 0 ] ).to.equal( 'directory/path/foo/LICENSE.md' );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 0 ] ).to.equal( 'directory/path/foo/lang/contexts.json' );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 0 ] ).to.equal( 'directory/path/foo/package.json' );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 0 ] ).to.equal( 'directory/path/foo/src/index.js' );

		expect( stubs.fs.writeFileSync.getCall( 0 ).args[ 1 ] ).to.equal( [
			'Copyright (c) 1984. All rights reserved.',
			''
		].join( '\n' ) );
		expect( stubs.fs.writeFileSync.getCall( 1 ).args[ 1 ] ).to.equal( [
			'{',
			'  "My plugin": "Content for a tooltip is displayed when a user hovers the CKEditor 5 icon."',
			'}'
		].join( '\n' ) );
		expect( stubs.fs.writeFileSync.getCall( 2 ).args[ 1 ] ).to.equal( JSON.stringify( {
			'name': '@foo/ckeditor5-featurename',
			'license': 'MIT',
			'dependencies': {
				'ckeditor5': '>=30.0.0'
			},
			'devDependencies': {
				'@ckeditor/ckeditor5-dev-build-tools': '40.0.0',
				'@ckeditor/ckeditor5-autoformat': '>=30.0.0',
				'@ckeditor/ckeditor5-basic-styles': '>=30.0.0',
				'@ckeditor/ckeditor5-block-quote': '>=30.0.0',
				'@ckeditor/ckeditor5-inspector': '>=',
				'@ckeditor/ckeditor5-package-tools': '25.0.0',
				'eslint': '^7.32.0',
				'eslint-config-ckeditor5': '>=',
				'stylelint': '^13.13.1',
				'stylelint-config-ckeditor5': '>='
			},
			'scripts': {
				'dll:build': 'ckeditor5-package-tools dll:build',
				'prepare': 'npm run dll:build',
				'prepublishOnly': 'npm run dll:build'
			}
		}, null, 2 ) );
		expect( stubs.fs.writeFileSync.getCall( 3 ).args[ 1 ] ).to.equal( [
			'/* JS CODE */'
		].join( '\n' ) );
	} );
} );

