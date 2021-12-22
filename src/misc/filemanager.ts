import * as fs from "fs";
import * as vscode from 'vscode';


import { Heatmap } from "./heatmap";
import { Highlight } from "./highlight";


function replacer(key: any, value: any) {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
      };
    } else {
      return value;
    }
  }
  
  function reviver(key: any, value: any) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }

class File{
    id: number = 0;
    path: string = "";
    dataxml: string = "";

    highlights: Highlight[] = [];
    heatmaps: Heatmap[] = [];
}

export class FileManager{

    static files: Map<number, File> = new Map<number,File>();
    public static folderPath: string = vscode.workspace.workspaceFolders![0].uri.path;

    static loadFile(path: string, id: number){
        let file = this.files.get(id);
        if(file === undefined){
            file = new File();
            file.id = id;
            file.path = path;
            if(fs.existsSync(`${this.folderPath}/discopop-tmp/${id}/Data.xml`)){
                file.dataxml = fs.readFileSync(`${this.folderPath}/discopop-tmp/${id}/Data.xml`).toString();
            }
            //this.files.set(id, file);
        }
        return file;
    }

    static pathExists(path: string){
        return Array.from(this.files.values()).find((value) => {
            return value.path === path;
        });
    }

    static reloadFileMapping(){
        let newMap = new Map<number, File>();
        if(fs.existsSync(`${this.folderPath}/discopop-tmp/FileMapping.txt`)){
            const filemapping = fs.readFileSync(`${this.folderPath}/discopop-tmp/FileMapping.txt`).toString();
            filemapping.split('\n').filter((el) => el !== '').forEach((fileStr) =>{
                console.log(fileStr);
                const fileStrSplit = fileStr.split('\t');
                const path = fileStrSplit[1];
                const newId = parseInt(fileStrSplit[0]);
                let file = this.pathExists(path);
                if(file !== undefined){
                    file.id = newId;
                    newMap.set(newId, file);
                }else {
                    newMap.set(newId, this.loadFile(path, newId));
                }
            });
            this.files = newMap;
        }
    this.writeToConfigFile();
    }
    static writeToConfigFile(){
        fs.writeFile(`${this.folderPath}/discopop-tmp/discopop_config2.json`, JSON.stringify(this.files, replacer), (err) => console.error(err));
    }

    static init(){

        this.reloadFileMapping();
        /*
        if(fs.existsSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`)){
            const jsonObject = JSON.parse(fs.readFileSync(`${this.folderPath}/discopop-tmp/discopop_config2.json`).toString(), reviver);
            this.files = jsonObject;
        }else{
            this.reloadFileMapping();
            this.writeToConfigFile();
        }
        */
    }

}