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
		}
	})
	
	grunt.loadNpmTasks('grunt-contrib-uglify')
	grunt.loadNpmTasks('grunt-contrib-cssmin')
	grunt.loadNpmTasks('grunt-contrib-jshint')
	grunt.loadNpmTasks('grunt-contrib-watch')
	
	grunt.registerTask('default', ['uglify', 'cssmin']);
}