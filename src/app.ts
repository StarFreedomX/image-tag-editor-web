import express from 'express'
import fs from 'fs'
import os from 'os';
import path, { dirname } from 'path'
import 'tsconfig-paths/register';
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url'
import { mainPageRouter } from '@/router/mainPage'
import { folderRouter } from "@/router/folder";
import { getImageRouter } from "@/router/getImage";
import { addTagRouter, delTagRouter, getTagRouter } from "@/router/tag";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

export const config: Config = JSON.parse(fs.existsSync('./config.json') ? fs.readFileSync('./config.json', 'utf-8') : '{}');

export const imageDir = resolvePath(config.imageFolderPath);

export const configDir = resolvePath(config.tagConfigOutputPath);

if (!fs.existsSync(configDir)) fs.mkdirSync(configDir)

export interface Config {
    ip: string,
    port: number,
    imageFolderPath: string,
    tagConfigOutputPath: string,
    tokens: {
        [folder: string]: {
            [token: string]: string; // token -> username
        };
    };
}

// 设置模板引擎
app.set('view engine', 'ejs');
// 设置模板文件目录
app.set('views', resolvePath('./views'));

app.use(bodyParser.json())
app.use('/', mainPageRouter)
app.use('/groups', folderRouter);
app.use('/images', getImageRouter)
app.use('/tag', addTagRouter)
app.use('/delete-tag', delTagRouter)
app.use('/tags', getTagRouter)

function expandPath(p: string): string {
    // 展开 ~ 为 home 目录
    if (p.startsWith('~')) {
        p = path.join(os.homedir(), p.slice(1));
    }
    // 展开 %VAR% (Windows)
    p = p.replace(/%([^%]+)%/g, (_, name) => process.env[name] || `%${name}%`)
            // 展开 $VAR (Unix)
            .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => process.env[name] || `$${name}`);

    return p;
}

/**
 * 获取绝对路径（自动展开环境变量和相对路径）
 */
function resolvePath(inputPath: string): string {
    const expanded = expandPath(inputPath);
    return path.isAbsolute(expanded)
        ? expanded
        : path.resolve(__dirname, expanded);
}



app.listen(config.port || 3567, config.ip || '127.0.0.1', () => {
    console.log(`✅ 本地图片标签服务已启动: http://localhost:${config.port}`)
}).on('error', (err: Error) => {
    console.error(err)
})
