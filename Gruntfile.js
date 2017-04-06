let shellescape = require("shell-escape"),
	child_process = require("child_process"),
	path = require("path"),
	chalk = require("chalk");

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		watch: {
			sass: {
				files: "wvm/style/*.scss",
				tasks: ["sass"],
				options: {
					spawn: false
				}
			},

			browserify: {
				files: ["wvm/dist/app.js"],
				options: { spawn: false },
				tasks: ["exorcise"]
			},

			wasm: {
				files: ["**/*.wasm"],
				tasks: ["wasmc"]
			},

			nearley: {
				files: ["wasm/wasm.ne"],
				tasks: ["nearley"]
			}
		},

		exorcise: {
			bundle: {
				options: { },
				files: {
					"wvm/dist/app.js.map": ["wvm/dist/app.js"]
				}
			}
		},

		sass: {
			options: {
				sourceMap: true
			},

			dist: {
				files: {
					"wvm/dist/app.css": "wvm/style/app.scss"
				}
			}
		},

		browserify: {
			dev: {
				src: ["wvm/browser/**/*.js", "wvm/browser/**/*.jsx"],
				dest: "wvm/dist/app.js",
				options: {
					transform: [
						["babelify", {presets: ["es2017", "es2015"]}],
						["brfs"]
					],
					watch: true,
					keepAlive: false,
					browserifyOptions: {
						debug: true,
					}
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-sass");
	grunt.loadNpmTasks("grunt-browserify");
	grunt.loadNpmTasks("grunt-babel");
	grunt.loadNpmTasks("grunt-exorcise");
	grunt.loadNpmTasks("grunt-shell");

	grunt.registerTask("wasmc", "Dummy task for wasmc.js.", () => { });
	grunt.registerTask("nearley", "Compiles WASM's nearley source.", () => {
		child_process.exec("node node_modules/nearley/bin/nearleyc.js wasm/wasm.ne -o wasm/wasm.js", (error, stdout, stderr) => {
			if (error) {
				console.error(chalk.red(`Couldn't compile wasm.ne:`));
				console.error(chalk.red.dim(error.message));
			} else if (stderr) {
				console.error(`Error during compilation:`, stderr);
			} else {
				console.log(chalk.green(stdout));
			};
		});
	});

	grunt.event.on("watch", (action, file, name) => {
		// There's almost certainly a better way to do this.
		if (name == "wasm") {
			child_process.exec(shellescape(["node", "wasm/wasmc.js", file, "-o", `wasm/compiled/${path.basename(file).replace(/\.wasm$/i, "")}.why`]), (error, stdout, stderr) => {
				if (error) {
					console.error(chalk.red(`Couldn't compile ${file}:`));
					console.error(chalk.red.dim(error.message));
				} else if (stderr) {
					console.error(`Error during compilation:`, stderr);
				} else if (stdout.match(/Successfully assembled/)) {
					console.log(chalk.green(stdout));
				} else {
					console.log("???", stdout);
				};
			});
		};
	});

	grunt.registerTask("default", ["nearley", "sass", "browserify:dev", "watch"]);
};
