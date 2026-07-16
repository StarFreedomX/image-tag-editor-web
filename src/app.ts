import express from 'express'
import fs from 'fs'
import os from 'os';
import path from 'path'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { folderRouter } from "@/router/folder";
import { getImageRouter } from "@/router/getImage";
import { addTagRouter, delTagRouter, getTagRouter } from "@/router/tag";
import { tokenRequestRouter } from "@/router/tokenRequest";
import { tokenManageRouter } from "@/router/tokenManage";
import { getUserRole, getUserLabel } from "@/authorizeMiddleware";
import { writeAction } from "@/router/opLog";
import { readLogs } from "@/router/opLog";

const app = express()

export const config: Config = JSON.parse(fs.existsSync('./config.json') ? fs.readFileSync('./config.json', 'utf-8') : '{}');

export const imageDir = resolvePath(config.imageFolderPath);

export const configDir = resolvePath(config.tagConfigOutputPath);

export const autoTokensPath = path.resolve(configDir, '..', 'auto-tokens.json');
export const logDir = path.resolve(configDir, '..', '..', 'logs');

if (!fs.existsSync(configDir)) fs.mkdirSync(configDir)
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

export interface Config {
    ip: string,
    port: number,
    imageFolderPath: string,
    tagConfigOutputPath: string,
    botApiUrl: string,
    botApiSecret: string,
}

// 设置模板引擎
app.set('view engine', 'ejs');
// 设置模板文件目录
app.set('views', resolvePath('./views'));

app.use(bodyParser.json())
app.use(cookieParser())
app.get('/', (_req, res) => res.render('login'))
app.use('/groups', folderRouter);
app.use('/images', getImageRouter)
app.use('/tag', addTagRouter)
app.use('/delete-tag', delTagRouter)
app.use('/tags', getTagRouter)
app.use('/get-token', tokenRequestRouter)
app.use('/manage', tokenManageRouter)

// 删除语录图片（admin/owner）
app.post('/images/delete', (req, res) => {
    const token = req.body?.token || req.cookies?.starfx_token || '';
    const role = getUserRole(token);
    if (role !== 'admin' && role !== 'owner') {
        return res.status(403).json({ error: '权限不足' });
    }
    const { folder, filename } = req.body;
    if (!folder || !filename) return res.status(400).json({ error: '缺少参数' });

    // 删图片
    const recordDir = path.join(imageDir, folder);
    const file = fs.existsSync(recordDir) ? fs.readdirSync(recordDir).find(f => path.parse(f).name === filename) : null;
    if (file) fs.unlinkSync(path.join(recordDir, file));

    // 删 tag
    const tagPath = path.join(configDir, `${folder}.json`);
    if (fs.existsSync(tagPath)) {
        const tags = JSON.parse(fs.readFileSync(tagPath, 'utf8'));
        delete tags[filename];
        fs.writeFileSync(tagPath, JSON.stringify(tags, null, 2));
    }

    const label = getUserLabel(token);
    writeAction(`[删除语录] ${label} IP=${req.ip} group=${folder} image=${filename}`);

    return res.json({ success: true });
});

// 用户管理（owner）
app.get('/users', (req, res) => {
    const token = req.cookies?.starfx_token || '';
    if (getUserRole(token) !== 'owner') return res.status(403).send('权限不足');
    res.render('users', { token });
});
app.post('/users/list', async (req, res) => {
    const token = req.body?.token || req.cookies?.starfx_token || '';
    if (getUserRole(token) !== 'owner') return res.status(403).json({ error: '权限不足' });
    try {
        const resp = await fetch(`${config.botApiUrl}/starfx/api/record/list-users`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-secret': config.botApiSecret },
            body: JSON.stringify({ token })
        });
        return res.json(await resp.json());
    } catch { return res.status(502).json({ error: 'Bot 服务异常' }); }
});
app.post('/users/set-role', async (req, res) => {
    const token = req.body?.token || req.cookies?.starfx_token || '';
    if (getUserRole(token) !== 'owner') return res.status(403).json({ error: '权限不足' });
    try {
        const resp = await fetch(`${config.botApiUrl}/starfx/api/record/set-role`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-secret': config.botApiSecret },
            body: JSON.stringify({ token, targetQqId: req.body.targetQqId, role: req.body.role })
        });
        return res.json(await resp.json());
    } catch { return res.status(502).json({ error: 'Bot 服务异常' }); }
});
app.post('/users/delete', async (req, res) => {
    const token = req.body?.token || req.cookies?.starfx_token || '';
    if (getUserRole(token) !== 'owner') return res.status(403).json({ error: '权限不足' });
    try {
        const resp = await fetch(`${config.botApiUrl}/starfx/api/record/delete-user`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-secret': config.botApiSecret },
            body: JSON.stringify({ token, targetQqId: req.body.targetQqId })
        });
        return res.json(await resp.json());
    } catch { return res.status(502).json({ error: 'Bot 服务异常' }); }
});

// 查看日志（owner）
app.get('/logs', (req, res) => {
    const token = req.cookies?.starfx_token || '';
    if (getUserRole(token) !== 'owner') return res.status(403).send('权限不足');
    res.render('logs');
});
app.get('/logs/data', (req, res) => {
    const token = req.cookies?.starfx_token || '';
    if (getUserRole(token) !== 'owner') return res.status(403).json({ error: '权限不足' });
    res.json(readLogs(7));
});

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
    console.log(`✅ 本地图片标签服务已启动: http://${config.ip || "localhost"}:${config.port}`)
}).on('error', (err: Error) => {
    console.error(err)
})
