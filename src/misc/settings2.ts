class Setting{
    text: string;
    enabled: boolean;

    constructor(text: string, enabled: boolean){
        this.text=text;
        this.enabled = enabled;
    }
}

export class Settings{
    private static settings: Map<string, Setting> = new Map<string, Setting>([
        ['loopCounter', new Setting('Show loop counter highlights', true)], 
        ['autoPipeline', new Setting('Automatically execute all steps', false)],
        ['autoFilemapping', new Setting('Run filemapping in background', false)],
        ['allFiles', new Setting('Show all files', false)],
    ]);
    
    static getAll(){
        return this.settings;
    }
    static get(key: string){
        return this.settings.get(key);
    }
    static getValue(key: string){
        const setting =  this.settings.get(key);
        if(setting){
            return setting.enabled;
        }else{
            return false;
        }
    }

    static flip(key: string){
        const setting= this.settings.get(key);
        if(setting){
            setting.enabled = !setting.enabled;
        }
    }
}