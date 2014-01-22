module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		cssmin: {
			minify: {
				expand: true,
				cwd: 'public/css/',
				src: ['*.css', '!*.min.css'],
				dest: 'public/css',
				ext: '.min.css'
			}
		},
		
		uglify: {
			options: {
				mangle: false
			},
			my_target: {
				files: [{
					expand: true,
					cwd: 'public/js',
					src: ['*.js', '!*.min.js'],
					dest: 'public/js',
					ext: '.min.js'
				}]
			}
		},
		
		jshint: {
			options: {
				asi: true
			},
			all: ['public/js/*.js', 'routes/**', 'app.js', 'config.js', 'util.js', 'scripts/*.js']
		},
		
		watch: {
			scripts: {
				files: ['public/js/*.js', 'routes/**', 'app.js', 'config.js', 'util.js', 'scripts/*.js', '!public/js/*.min.js'],
				tasks: ['jshint'],
			},
			options: {
				livereload: true,
			}
		},
		
		concat: {
			options: {},
			dist: {
				src: ['public/js/bugsnag.js', 'public/js/gan.js', 'public/js/vendor/jquery.min.js', 'public/js/vendor/bootstrap.min.js', 'public/js/vendor/angular.min.js', 'public/js/geo.js', 'public/js/angular-eventmost.js'],
				dest: 'public/js/vendor/all_required.min.js'
			}
		}
	})
	
	grunt.loadNpmTasks('grunt-contrib-uglify')
	grunt.loadNpmTasks('grunt-contrib-cssmin')
	grunt.loadNpmTasks('grunt-contrib-jshint')
	grunt.loadNpmTasks('grunt-contrib-watch')
	grunt.loadNpmTasks('grunt-contrib-concat')
	
	grunt.registerTask('default', ['uglify', 'cssmin']);
}