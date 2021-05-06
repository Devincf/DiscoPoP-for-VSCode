// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec, execSync } from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "discopopvsc" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('discopopvsc.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from DiscoPoP for VSCode!');
	});

	context.subscriptions.push(disposable);

	const folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this

	let fmapCommand = vscode.commands.registerCommand('discopopvsc.fmap', () => {
		//copy from scripts to folder
		console.log("Filemapping");
		const dpfmapPath = `${vscode.workspace.getConfiguration("discopopvsc").get("path")}/${vscode.workspace.getConfiguration("discopopvsc").get("scripts_folder")}/dp-fmap`;

		//const folderPath = vscode.workspace.workspaceFolders![0].uri.path; //TODO: think about how to properly do this
		fs.stat(dpfmapPath, (err, stats) => {
			if (err) {
				vscode.window.showErrorMessage(`Error creating File Mapping. dp-fmap file not found in path ${dpfmapPath}`);
				return;
			}
			fs.copyFile(dpfmapPath, folderPath + '/dp-fmap', () => {
				//execute
				exec('./dp-fmap', { cwd: folderPath }, (error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage('Error creating File Mapping');
						console.log(`error: ${error.message}`);
						return;
					}
					if (stderr) {
						vscode.window.showErrorMessage('Error creating File Mapping');
						console.log(`stderr: ${stderr}`);
						return;
					}
					vscode.window.showInformationMessage('File Mapping created successfully');
				});
			});
		});
	});
	context.subscriptions.push(fmapCommand);

	const buildPath = `${vscode.workspace.getConfiguration("discopopvsc").get("path")}/${vscode.workspace.getConfiguration("discopopvsc").get("build_folder")}/`;

	let cugenCommand = vscode.commands.registerCommand('discopopvsc.cugen', () => {
		//TODO: add include dir, and other options
		//TODO: execute this for every file in FileMapping.txt
		fs.stat(folderPath + '/FileMapping.txt', (err, stats) => {
			let files: string[] = [];
			fs.readFile(folderPath + '/FileMapping.txt', 'utf8', async (err, data: string) => {
				if (err) {
					vscode.window.showErrorMessage(`Error generating CU. Please create the FileMappings first!`);
					console.log(`error: ${err}`);
					return;
				}
				files = data.split('\n').filter((el) => el !== '');
				files = files.map(str => str.trim().substr(2));
				console.log(files);
				files.forEach(async (file, index) => {
					console.log(`CU Generation for file (${index}) ${file}`);
					let re = new RegExp(folderPath + "\/(.*)[\.]");
					const outFileName = file.match(re)![1];
					console.log(file.match(re));
					await exec(`${vscode.workspace.getConfiguration("discopopvsc").get("clang")} -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${buildPath}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ./FileMapping.txt -c ${file} -o ${outFileName}`, { cwd: folderPath }, (error, stdout, stderr) => {
						if (error) {
							vscode.window.showErrorMessage(`Error generating CU for file ${outFileName}`);
							console.log(`error: ${error.message}`);
							return;
						}
					});
				});
				vscode.window.showInformationMessage('Finished CU Generation');
			});
		});
	});
	context.subscriptions.push(cugenCommand);


	let dependprofCommand = vscode.commands.registerCommand('discopopvsc.dependprof', () => {
		//TODO: add include dir, and other options
		//TODO: execute this for every file in FileMapping.txt
		let files: string[] = [];
		fs.readFile(folderPath + '/FileMapping.txt', 'utf8', async (err, data: string) => {
			if (err) {
				vscode.window.showErrorMessage(`Error while dependency profiling. Please create the FileMappings first!`);
				console.log(`error: ${err}`);
				return;
			}
			files = data.split('\n').filter((el) => el !== '');
			files = files.map(str => str.trim().substr(2));
			console.log(files);
			files.forEach(async (file, index) => {
				console.log(`Dependency Profiling for file (${index}) ${file}`);
				let re = new RegExp(folderPath + "\/(.*).");
				const outFileName = file.match(re)![1];
				exec(`${vscode.workspace.getConfiguration("discopopvsc").get("clang")} -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${buildPath}/libi/LLVMDPInstrumentation.so -mllvm -fm-path -mllvm ./FileMapping.txt -o ${outFileName}_dp.ll ${file}`, { cwd: folderPath }, (error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage(`Error during step 1 of identifying data dependencies in file ${outFileName}`);
						console.log(`error: ${error.message}`);
						return;
					}
					exec(`${vscode.workspace.getConfiguration("discopopvsc").get("clang")} ${outFileName}_dp.ll -o ${outFileName}_dp_run -L${buildPath}/rtlib -lDiscoPoP_RT -lpthread`, { cwd: folderPath }, (error, stdout, stderr) => {
						if (error) {
							vscode.window.showErrorMessage(`Error during step 2 of identifying data dependencies in file ${outFileName}`);
							console.log(`error: ${error.message}`);
							return;
						}
						if (stderr) {
							vscode.window.showErrorMessage(`(std)Error during step 2 of identifying data dependencies in file ${outFileName}`);
							console.log(`stderr: ${stderr}`);
							return;
						}
						exec(`./${outFileName}_dp_run`, { cwd: folderPath }, (error, stdout, stderr) => {
							if (error) {
								vscode.window.showErrorMessage(`Error during step 3 of identifying data dependencies in file ${outFileName}`);
								console.log(`error: ${error.message}`);
								return;
							}
							if (stderr) {
								vscode.window.showErrorMessage(`(std)Error during step 3 of identifying data dependencies in file ${outFileName}`);
								console.log(`stderr: ${stderr}`);
								return;
							}
						});
					});
				});
			});
			vscode.window.showInformationMessage('Finished identifying data dependencies');
		});
	});
	context.subscriptions.push(dependprofCommand);

	let idredopCommand = vscode.commands.registerCommand('discopopvsc.idredop', () => {
		//TODO: add include dir, and other options
		//TODO: execute this for every file in FileMapping.txt
		let files: string[] = [];
		fs.readFile(folderPath + '/FileMapping.txt', 'utf8', async (err, data: string) => {
			if (err) {
				vscode.window.showErrorMessage(`Error while identifying reduction operations. Please create the FileMappings first!`);
				console.log(`error: ${err}`);
				return;
			}
			files = data.split('\n').filter((el) => el !== '');
			files = files.map(str => str.trim().substr(2));
			console.log(files);
			files.forEach(async (file, index) => {
				console.log(`Identifying reduction operations for file (${index}) ${file}`);
				let re = new RegExp(folderPath + "\/(.*).");
				const outFileName = file.match(re)![1];
				exec(`${vscode.workspace.getConfiguration("discopopvsc").get("clang")} -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${buildPath}/libi/LLVMDPReduction.so -mllvm -fm-path -mllvm ./FileMapping.txt -o ${outFileName}_red.bc ${file}`, { cwd: folderPath }, (error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage(`Error during step 1 of identifying reduction operations in file ${outFileName}`);
						console.log(`error: ${error.message}`);
						return;
					}
					exec(`${vscode.workspace.getConfiguration("discopopvsc").get("clang")} ${outFileName}_red.bc -o ${outFileName}_dp_run_red -L${buildPath}/rtlib -lDiscoPoP_RT -lpthread`, { cwd: folderPath }, (error, stdout, stderr) => {
						if (error) {
							vscode.window.showErrorMessage(`Error during step 2 of identifying reduction operations in file ${outFileName}`);
							console.log(`error: ${error.message}`);
							return;
						}
						if (stderr) {
							vscode.window.showErrorMessage(`(std)Error during step 2 of identifying reduction operations in file ${outFileName}`);
							console.log(`stderr: ${stderr}`);
							return;
						}
						exec(`./${outFileName}_dp_run_red`, { cwd: folderPath }, (error, stdout, stderr) => {
							if (error) {
								vscode.window.showErrorMessage(`Error during step 3 of identifying reduction operations in file ${outFileName}`);
								console.log(`error: ${error.message}`);
								return;
							}
							if (stderr) {
								vscode.window.showErrorMessage(`(std)Error during step 3 of identifying reduction operations in file ${outFileName}`);
								console.log(`stderr: ${stderr}`);
								return;
							}
						});
					});
				});
			});
			vscode.window.showInformationMessage('Finished identifying data dependencies');
		});
	});

	let patidCommand = vscode.commands.registerCommand('discopopvsc.patid', () => {

	});

}

// this method is called when your extension is deactivated
export function deactivate() { }
