const _ = require('lodash');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const clean = require('gulp-rimraf');
const eslint = require('gulp-eslint');
const todo = require('gulp-todo');
const webpack = require('webpack-stream');
const webpackConfig = require('./webpack/webpack.config.js');

gulp.task('clean', () => {
	return gulp.src('./dist', {allowEmpty: true})
        .pipe(clean());
});

function fetchWebpackTasks(watch) {
	return _.map(webpackConfig, (config) => {
		if (!config.output) {
			throw new Error('config.output must be defined');
		}
		if (!_.isString(config.output.path)) {
			throw new Error('config.output.path must be a string');
		}
		config = {
			...config,
			watch
		};
		return () => {
			return webpack(config).pipe(gulp.dest(config.output.path));
		};
	});
}

gulp.task('webpack', gulp.parallel(fetchWebpackTasks(false)));
gulp.task('webpack-watch', gulp.parallel(fetchWebpackTasks(true)));

const buildTask = gulp.series(
	'clean',
	gulp.parallel(
		'webpack',
	)
);

gulp.task('build', buildTask);
exports.default = buildTask;

const watchTask = gulp.parallel([
	'webpack-watch',
]);
gulp.task('watch', watchTask);
gulp.task('dev', watchTask);

gulp.task('lint', () => {

	const hasFixFlag = process.argv.slice(2).includes('--fix');

	return gulp.src([
			'**/*.js',
			'**/*.ts',
			'!node_modules/**',
			'!dist/**',
		])
		// eslint() attaches the lint output to the 'eslint' property
		// of the file object so it can be used by other modules.
		.pipe(eslint({fix: hasFixFlag}))
		.pipe(gulpIf(hasFixFlag, gulp.dest('.')))
		// eslint.format() outputs the lint results to the console.
		// Alternatively use eslint.formatEach() (see Docs).
		.pipe(eslint.format())
		// To have the process exit with an error code (1) on
		// lint error, return the stream and pipe to failAfterError last.
		.pipe(eslint.failAfterError());
});

gulp.task('todo', () => {
    return gulp.src([
		'**/*.js',
		'**/*.ts',
		'!node_modules/**',
		'!dist/**',
	])
	.pipe(todo())
	.pipe(gulp.dest('./'));
	// -> Will output a TODO.md with your todos
});

gulp.task('install-githooks', gulp.parallel([
	()=>{
		return gulp.src('./githooks/**/*', {base: './githooks/'})
		.pipe(gulp.dest('./.git/hooks'))
	}
]));
