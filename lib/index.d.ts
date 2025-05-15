export interface Config {
    ip: string;
    port: number;
    imageFolderPath: string;
    tagConfigOutputPath: string;
    tokens: {
        [folder: string]: {
            [token: string]: string;
        };
    };
}
