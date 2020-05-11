const gulp = require('gulp');
const gulpIf = require('gulp-if');
const clean = require('gulp-rimraf');
const eslint = require('gulp-eslint');
const todo = require('gulp-todo');
const webpack = require('webpack-stream');

gulp.task('clean', () => {
	return gulp.src('./dist', {allowEmpty: true})
        .pipe(clean());
});

gulp.task('webpack', () => {
  return gulp.src('index.ts')
  .pipe(webpack( require('./webpack/webpack.server.js') ))
  .pipe(gulp.dest('./dist'));
});

gulp.task('webpack-tests', () => {
  return gulp.src('test-runner.ts')
  .pipe(webpack( require('./webpack/webpack.tests.js') ))
  .pipe(gulp.dest('./dist/tests'));
});

gulp.task('webpack-watch', () => {
  const webpackConfig = require('./webpack/webpack.server.js');
  webpackConfig.watch = true;
  return gulp.src('index.ts')
  .pipe(webpack( webpackConfig ))
  .pipe(gulp.dest('./dist'));
});

gulp.task('webpack-tests-watch', () => {
	const webpackConfig = require('./webpack/webpack.tests.js');
	webpackConfig.watch = true;
	return gulp.src('test-runner.ts')
	.pipe(webpack( webpackConfig ))
	.pipe(gulp.dest('./dist/tests'));
  });

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
	'webpack-tests-watch',
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
