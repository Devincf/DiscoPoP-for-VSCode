import * as fs from "fs";
import * as vscode from 'vscode';


import {v4 as uuidv4} from 'uuid';
import { SourceHighlighting } from "./source_highlighting";
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
    path: string;
    selected: boolean;
    dataxml: string;

    constructor(path: string,selected: boolean){
        this.path= path;
        this.selected = selected;
        this.dataxml = "";
    }
}

export class Configuration{
    static updateHighlights(highlights: any) {
        this.configs.set('highlighting', highlights);
        this.writeToFile();
    }

    private static configs: Map<string, Map<string,any>> = new Map<string, Map<string,any>>();
    public static folderPath: string = vscode.workspace.workspaceFolders![0].uri.path;


    static writeToConfig(key: string, subkey: string, value: any){
        if(!this.configs.has(key)){
            this.configs.set(key, new Map<string,typeof value>());
        }
        this.configs.get(key)?.set(subkey,value);
        this.writeToFile();
    }

    static getConfig(key: string){
        return this.configs.get(key);
    }

    static getConfigValue(key: string, subkey: string){
        const a = this.configs.get(key);
        const b = a?.get(subkey);
        return b;
    }

    static exists(key: string, subkey: string){
        return this.configs.get(key)?.has(subkey);
    }

    static existsValue(key: string, value: string){
        let returnKey = "";
        this.configs.get(key)?.forEach((val,k) => { 
            if(val === value){ returnKey = k;}});
        return returnKey === ""? false : returnKey;
    }

    static getFiles(){
        return this.configs.get('files');
    }

    static existsFileInConfig(value: string){
        let returnKey = "";
        if(!this.configs.has('files')){
            return returnKey;
        }
        this.configs.get('files')?.forEach((val,k) => { 
            if(val.path === value){ returnKey = k;}});
        return returnKey === ""? false : returnKey;
    }

    static getFileUuid(fileName: string){
        let fileKey = Configuration.existsFileInConfig(fileName);
        if(!fileKey){
            //generate key
            fileKey = uuidv4();
            Configuration.writeToConfig('files', fileKey, new File(fileName, true));
        }
        return fileKey;
    }

    static load(){
        if(fs.existsSync(`${Configuration.folderPath}/discopop-tmp/discopop_config.json`)){
            const file = fs.readFileSync(`${Configuration.folderPath}/discopop-tmp/discopop_config.json`).toString();
            const mainJSON = JSON.parse(file);

                /*let map = new Map<string, Map<string, string>>();
                for(let k of Object.keys(jsonObject)){
                    let tmpMap = new Map<string,string>();
                    for(let j of Object.keys(jsonObject[k])){
                        tmpMap.set(j,jsonObject[k][j]);
                    }
                    map.set(k, tmpMap);
                }*/

            //load files
            {
                const jsonObject = JSON.parse(mainJSON['files'], reviver);
                this.configs.set('files', jsonObject);
            }
            {
                const jsonObject = JSON.parse(mainJSON['highlighting'], reviver);
                this.configs.set('highlighting', jsonObject);
            }
        }
    }
    static writeToFile(){
        fs.writeFile(`${this.folderPath}/discopop-tmp/discopop_config.json`, JSON.stringify({
            "files": JSON.stringify(this.configs.get('files'), replacer),
            "highlighting": JSON.stringify(this.configs.get('highlighting'), replacer)
        }), (err) => console.error(err));
        //fs.writeFile(`${this.folderPath}/discopop-tmp/discopop_config.json`, JSON.stringify(this.configs, replacer), (err) => console.error(err));
    }
}