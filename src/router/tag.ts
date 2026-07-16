import { authorizeMiddleware, getUserRole, getUserLabel } from "@/authorizeMiddleware";
import { Router } from "express";
import bodyParser from 'body-parser';
import path from "path";
import fs from "fs";
import { configDir } from "@/app";
import { writeAction } from "@/router/opLog";

const addRouter: Router = Router();
const delRouter: Router = Router();
const getRouter: Router = Router();

// 添加 tag
addRouter.post('/', bodyParser.urlencoded({ extended: true }), authorizeMiddleware, (req, res) => {
    const { folder, name, tags, token } = req.body as { folder: string, name: string, tags: string, token: any }
    const configPath = path.join(configDir, `${folder}.json`)
    let tagData: Record<string, string[]> = {}
    if (fs.existsSync(configPath)) tagData = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (!tagData[name]) tagData[name] = []
    tagData[name].push(...tagList)
    tagData[name] = Array.from(new Set(tagData[name]))

    fs.writeFileSync(configPath, JSON.stringify(tagData, null, 2))
    writeAction(`[添加标签] ${getUserLabel(token)} IP=${req.ip} folder=${folder} image=${name} tags=${tags}`)
    res.status(200).end()
})

// 删除 tag（admin/owner）
delRouter.post('/', bodyParser.json(), authorizeMiddleware, (req, res) => {
    const { folder, name, tag, token } = req.body as { folder: string, name: string, tag: string, token: any }

    const role = getUserRole(token);
    if (role !== 'admin' && role !== 'owner') {
        return res.status(403).json({ error: '权限不足，仅管理员可删除标签' });
    }

    const configPath = path.join(configDir, `${folder}.json`)
    if (!fs.existsSync(configPath)) return res.status(404).end()

    const tagData: Record<string, string[]> = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    if (tagData[name]) {
        tagData[name] = tagData[name].filter(t => t !== tag)
        fs.writeFileSync(configPath, JSON.stringify(tagData, null, 2))
        writeAction(`[删除标签] ${getUserLabel(token)} IP=${req.ip} folder=${folder} image=${name} tag=${tag}`)
    }
    res.status(200).end()
})

// 获取 tag
getRouter.get('/:folder/:filename', authorizeMiddleware, (req, res) => {
    const { folder, filename } = req.params;

    const configPath = path.join(configDir, `${folder}.json`);

    if (!fs.existsSync(configPath)) return res.status(404).send([]);

    const tagData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const tags = tagData[filename] || [];
    res.json(tags);
});

export { addRouter as addTagRouter, delRouter as delTagRouter, getRouter as getTagRouter };
