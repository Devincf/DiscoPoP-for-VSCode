import * as fs from "fs";
import * as vscode from 'vscode';


import { File } from "./file";


function replacer(key: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else if (value instanceof File) {
        return {
            dataType: 'File',
            value: JSON.stringify(value),
        };
    } else {
        return value;
    }
}

function reviver(key: any, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        } else if (value.dataType === 'File') {
            let file = new File();
            Object.assign(file, JSON.parse(value.value));
            return file;
        }
    }
    return value;
}

export class FileManager {

    static files: Map<number, File> = new Map<number, File>();
    public static folderPath: string = vscode.workspace.workspaceFolders![0].uri.path;
    static configExisted: boolean = false;

    static loadFile(path: string, id: number) {
        let file = this.files.get(id);
        if (file === undefined) {
            file = new File();
            file.id = id;
            file.path = path;
            if (fs.existsSync(`${this.folderPath}/Makefile`)) {
                file.makefileGenerated = true;
            }
            if (fs.existsSync(`${this.folderPath}/discopop-tmp/${id}/Data.xml`)) {
                file.dataxml = fs.readFileSync(`${this.folderPath}/discopop-tmp/${id}/Data.xml`).toString();
            }
            //this.files.set(id, file);
        }
        return file;
    }

    static getFiles() {
        return this.files;
    }

    static getFile(id: number) {
        return this.files.get(id);
    }

    static getFileFromName(fileName: string) {
        return this.pathExists(fileName);
    }

    static getFileId(fileName: string) {
        return this.getFileFromName(fileName)?.id;
    }

    static pathExists(path: string) {
        return Array.from(this.files.values()).find((value) => {
            return value.path === path;
        });
    }

    static reloadFileMapping() {
        let newMap = new Map<number, File>();
        if (fs.existsSync(`${this.folderPath}/discopop-tmp/FileMapping.txt`)) {
            const filemapping = fs.readFileSync(`${this.folderPath}/discopop-tmp/FileMapping.txt`).toString();
            filemapping.split('\n').filter((el) => el !== '').forEach((fileStr) => {
                //console.log(fileStr);
                const fileStrSplit = fileStr.split('\t');
                const path = fileStrSplit[1];
                const newId = parseInt(fileStrSplit[0]);
                let file = this.pathExists(path);
                if (file !== undefined) {
                    file.id = newId;
                    newMap.set(newId, file);
                } else {
                    const newFile = this.loadFile(path, newId);
                    newMap.set(newId, newFile);
                }
            });
            this.files = newMap;
        }
        this.writeToConfigFile();
    }
    static writeToConfigFile() {
        if(!fs.existsSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`) && this.configExisted){
            //got deleted some time... what do?
            this.configExisted = false;
            return false;
        }
        fs.writeFileSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`, JSON.stringify(this.files, replacer));
        this.configExisted = true;
        return true;
    }

    static hasData(){
        return Array.from(this.files.values()).find((value) => {
            return value.heatmaps.length>0 || value.patterns.length>0;
        }) !== undefined;
    }

    static init() {
        if (fs.existsSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`)) {
            const jsonObject = JSON.parse(fs.readFileSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`).toString(), reviver);
            this.files = jsonObject;
            this.configExisted = true;
        } else {
            this.reloadFileMapping();
            this.writeToConfigFile();
        }
    }

}