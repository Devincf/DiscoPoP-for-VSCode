import { existsSync, mkdirSync, readFileSync } from "fs";

export function getFiles(folderPath: string): string[] {
    if(existsSync(`${folderPath}/discopop-tmp/FileMapping.txt`)){
      const filemapping = readFileSync(`${folderPath}/discopop-tmp/FileMapping.txt`, 'utf8').split('\n').filter((el) => el !== '');
      return filemapping.map((file) => {
        const temp = file.substr(file.indexOf(folderPath));
        return temp;
      });
    }
    return [];
}

export function createFolderIfNotExist(path: string): boolean{
  if(!existsSync(path)){
    return mkdirSync(path, {recursive: true}) !== undefined;
  }
  return false;
}