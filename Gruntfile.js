module.exports = function ( grunt ) {
    'use strict';

    var pkg = grunt.file.readJSON( 'package.json' ),
        comment = '/**\n * <%= pkg.name %> - Javascript Library (jQuery plugin)\n * jQuery v1.9~ (http://jquery.com) + ixBand v1.0~ (http://ixband.com)\n * @version v<%= pkg.version %> (<%= grunt.template.today("yymmddHHMM") %>)\n * The MIT License (MIT), http://ixsnack.com\n */\n';

    // Project configuration.
    grunt.initConfig({
        pkg: pkg,
        'concat': {
            options: {
                separator: '\n\n\n',
                stripBanners: true,
                banner: comment + ";(function (window) {\n    'use strict';\n\n",
                process: function( src, filepath ) {
                    var result = src.replace( /VERSION: '',/, "VERSION: '" + pkg.version + "'," );
                    return result.replace( /^/gm, '    ' );
                },
                footer: '\n})( typeof window === "object" ? window : undefined );'
            },
            dist: {
                src: [
                    'src/main.js',
                    'src/plugin.js',
                    'src/BaseClass.js',
                    'src/ListIndexManager.js',
                    'src/ThumbController.js',
                    'src/SlideMax.js',
                    'src/SlideLite.js',
                    'src/OverlayList.js',
                    'src/OverlayList.Motion.js',
                    'src/OverlayList.OverlayMotion.js',
                    'src/OverlayList.SlideMotion.js',
                    'src/OverlayList.MaskMotion.js',
                    'src/BaseSlider.js',
                    'src/Slider.js',
                    'src/RangeSlider.js'
                ],
                dest: 'dist/<%= pkg.fileName %>.js'
            }
        },
        'uglify': {
            options: {
                banner: comment,
                ASCIIOnly: true
            },
            my_target: {
                files: [
					{
						expand: true,
						cwd: 'dist',
						src: ['<%= pkg.fileName %>.js'],
						dest: 'dist/',
						rename: function ( dest, src ) {
							return dest + src.replace( /.js$/, '.min.js' );
						}
					},
					{
						expand: true,
						cwd: 'dist',
						src: ['<%= pkg.fileName %>.js'],
						dest: 'dist/',
						rename: function ( dest, src ) {
							return dest + 'ixSnack.min.js';
						}
					}
                ]
            }
        },
        'string-replace': {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'test/',
                    src: '**/*',
                    dest: 'test/'
                }],
                options: {
                    //ixSnack new version source
                    replacements: [{
                        pattern: /\/v[0-9.]+\/ixSnack/g,
                        replacement: '/'
                    }, {
                        pattern: /\/ixSnack_([0-9.]+)(.min)*.js/g,
                        replacement: function ( match, p1, p2 ) {
                            return '/' + pkg.fileName + ( p2 || '' ) + '.js';
                        }
                    }]
                }
            }
        },
        'watch': {
            template: {
                options: {
                    liereload: true
                },
                files: ['src/**/*.js'],
                tasks: ['concat']
            }
        }
    });

    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-string-replace' );

    // Default task(s).
    grunt.registerTask( 'default', ['concat', 'watch'] );
    //JS compress
    grunt.registerTask( 'compress', ['uglify'] );
    //*.html ixsnack version replace
    grunt.registerTask( 'html-replace', ['string-replace'] );
};