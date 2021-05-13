import { existsSync, readFileSync } from "fs";

export function getFiles(folderPath: string): string[] {
    if(existsSync(folderPath + '/FileMapping.txt')){
      const filemapping = readFileSync(folderPath + '/FileMapping.txt', 'utf8').split('\n').filter((el) => el !== '');
      return filemapping.map((file) => {
        const temp = file.substr(file.indexOf(folderPath));
        return temp;
      });
    }
    return [];
}