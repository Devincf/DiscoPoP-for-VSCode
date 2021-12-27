import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../newnewdiscopop_webview_provider';
import { createFolderIfNotExist, getFiles } from '../misc/iomanip';
import { FileManager } from '../misc/filemanager';

export function executeCUGenTask(discopopView: DiscoPoPViewProvider, ifiles?: string[], showMessage: boolean = true, callback?: Function) {
    //copy from scripts to folder
    //console.log("executeCUGenTask");
    if (discopopView.useMakefile) {
        executeMakefile(discopopView, showMessage, callback);
    } else {
        executeNormal(discopopView, ifiles, showMessage, callback);
    }

}

function executeNormal(discopopView: DiscoPoPViewProvider, ifiles?: string[], showMessage: boolean = true, callback?: Function) {
    let files: string[] = [];
    if (ifiles === undefined) {
        files = getFiles(discopopView.folderPath);
    } else {
        files = ifiles;
    }
    const buildPath = vscode.workspace.getConfiguration("discopopvsc").get("build_path");
    files.forEach(async (file, index) => {
        console.log(`CU Generation for file (${index}) ${file}`);
        //let re = new RegExp(discopopView.folderPath + "(.*)\/[\.]");
        let re = new RegExp(/[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/g);
        const test = file.match(re);
        const outFileName = test![0];

        const clang = vscode.workspace.getConfiguration("discopopvsc").get("clang");
        //console.log(file.match(re));

        //let fileKey = Configuration.getFileUuid(file);
        let fileKey = FileManager.getFileId(file);


        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp`);
        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp/${fileKey}`);

        const execStr = `${clang} -g -O0 -fno-discard-value-names -Xclang -load -Xclang ${buildPath}/libi/LLVMCUGeneration.so -mllvm -fm-path -mllvm ../FileMapping.txt -c ${file} -o ${outFileName}`;
        //console.log(execStr);
        exec(execStr, { cwd: `${discopopView.folderPath}/discopop-tmp/${fileKey}` }, (error, stdout, stderr) => {
            if (callback !== undefined) {
                callback.call(null,1);
            }
            if (fs.existsSync(`${discopopView.folderPath}/discopop-tmp/${fileKey}/Data.xml`)) {
                const a = fs.readFileSync(`${discopopView.folderPath}/discopop-tmp/${fileKey}/Data.xml`).toString();
                if (fileKey) {
                    FileManager.getFile(fileKey)?.updateDataXML(a);
                    FileManager.writeToConfigFile();
                }
                //Configuration.getConfigValue('files', fileKey).dataxml = a;
                //Configuration.writeToFile();
            }
            if (error) {
                //vscode.window.showErrorMessage(`Error generating CU for file ${outFileName} : ${error}`);
                console.log(`error: ${error.message}`);
                return;
            }
            else if (stderr) {
                //vscode.window.showErrorMessage(`Error generating CU for file ${outFileName} : ${stderr}`);
                console.log(`error: ${stderr}`);
                return;
            }
            else if (showMessage) {
                vscode.window.showInformationMessage('Finished CU Generation');
            }
        });
    });
}

function executeMakefile(discopopView: DiscoPoPViewProvider, showMessage: boolean, callback?: Function) {
    const discopopPath = vscode.workspace.getConfiguration("discopopvsc").get("path");
    const buildPath = vscode.workspace.getConfiguration("discopopvsc").get("build_path");
    const execStr = `python3 -m Makefile_Analyzer --target-project=${discopopView.folderPath} --target-makefile=${discopopView.folderPath}/Makefile --dp-path=${discopopPath} --dp-build-path=${buildPath} --exec-mode=cu_gen --clang-bin=clang-8 --clang++-bin=clang++-8 --llvm-link-bin=llvm-link-8`;

    //const filesToMove = ["Data.xml", "OriginalVariables.txt", "DP_CUIDCounter.txt", "out"];

    exec(execStr, { cwd: discopopPath + "/discopop_makefile" }, (error, stdout, stderr) => {
        //create highlight for each obj
        const execStr = `make -f tmp_makefile.mk && ./out && cd ..`;
        exec(execStr, { cwd: discopopView.folderPath }, (error, stdout, stderr) => {
            if (showMessage) {
                vscode.window.showInformationMessage('Finished CU Generation using a Makefile'); 
            }
            if (callback !== undefined) {
                callback.call(null,1);
            }

            /*const files = fs.readdirSync(discopopView.folderPath);
            files.forEach((file) => {
                if(file.endsWith('.ll') || filesToMove.find((val) => val === file)){
                    fs.renameSync(`${discopopView.folderPath}/${file}`, `${discopopView.folderPath}/mkfile/${file}`);
                }
            });
*/
        });
    });
}