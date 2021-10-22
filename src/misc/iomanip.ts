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

export function nameFromPath(folderPath: string | undefined, filePath: string): string {
  if (folderPath === undefined) {
    return "";
  }
  //let re = new RegExp(folderPath + "\/(.*)");
  //const outFileName = filePath.match(re)![1];
  let re = new RegExp(folderPath + "\/(.*)[\.]");
  const outFileName = filePath.match(re)![1];
  console.log(`Called nameFromPath with folderPath: ${folderPath} and filePath: ${filePath}  and got result ${outFileName}`);
  return outFileName;
}

export function getAllPatternFiles(folderPath: string) {
  const testFolder = folderPath + '/discopop-tmp';

  const files = readdirSync(testFolder);
  let re = new RegExp("(.*)_patterns.json");
  return files.filter(file => re.test(file)).map(file => file.match(re)![1]);
}