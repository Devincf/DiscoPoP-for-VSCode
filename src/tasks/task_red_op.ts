import * as vscode from 'vscode';
import * as fs from 'fs';

import { exec } from 'child_process';
import { DiscoPoPViewProvider } from '../discopop_webview_provider';
import { createFolderIfNotExist, getFiles } from '../misc/iomanip';

export function executeRedOpTask(discopopView: DiscoPoPViewProvider, ifiles?: string[]) {
    //copy from scripts to folder
    console.log("executeDepProfTask");
    let files: string[] = [];
    if (ifiles === undefined) {
        files = getFiles(discopopView.folderPath);
    } else {
        files = ifiles;
    }
    files.forEach(async (file, index) => {
        console.log(`Identifying reduction operations for file (${index}) ${file}`);
        let re = new RegExp(discopopView.folderPath + "\/(.*)[\.]");
        const outFileName = file.match(re)![1];
        const clang = vscode.workspace.getConfiguration("discopopvsc").get("clang");

        createFolderIfNotExist(`${discopopView.folderPath}/discopop-tmp`);

        exec(`${clang} -g -O0 -S -emit-llvm -fno-discard-value-names -Xclang -load -Xclang ${discopopView.buildPath}/libi/LLVMDPReduction.so -mllvm -fm-path -mllvm ./FileMapping.txt -o ${outFileName}_red.bc ${file}`, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error during step 1 of identifying reduction operations in file ${outFileName}`);
                console.log(`error: ${error.message}`);
                return;
            }
            exec(`${clang} ${outFileName}_red.bc -o ${outFileName}_dp_run_red -L${discopopView.buildPath}/rtlib -lDiscoPoP_RT -lpthread`, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
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
                exec(`./${outFileName}_dp_run_red`, { cwd: discopopView.folderPath + '/discopop-tmp' }, (error, stdout, stderr) => {
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
                vscode.window.showInformationMessage('Finished identifying reduction operations');
            });
        });
    });
}