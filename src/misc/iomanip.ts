import { existsSync, mkdirSync, readFileSync ,readdirSync } from "fs";

export function getFiles(folderPath: string): string[] {
  if (existsSync(`${folderPath}/discopop-tmp/FileMapping.txt`)) {
    const filemapping = readFileSync(`${folderPath}/discopop-tmp/FileMapping.txt`, 'utf8').split('\n').filter((el) => el !== '');
    return filemapping.map((file) => {
      const temp = file.substr(file.indexOf(folderPath));
      return temp;
    });
  }
  return [];
}

export function createFolderIfNotExist(path: string): boolean {
  if (!existsSync(path)) {
    return mkdirSync(path, { recursive: true }) !== undefined;
  }
  return false;
}

export function getAllFilesInFolderWithPattern(folderPath: string, pattern: string){

  const files = readdirSync(folderPath);
  let re = new RegExp(pattern);
  return files.filter(file => re.test(file)).map(file => file.match(re)![1]);
}