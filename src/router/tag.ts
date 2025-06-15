import { authorizeMiddleware } from "@/authorizeMiddleware";
import express from "express";
import bodyParser from 'body-parser';
import path from "path";
import fs from "fs";
import { configDir } from "@/app";
const addRouter = express.Router();
const delRouter = express.Router();
const getRouter = express.Router();

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
    console.log(`[ADD] add tag of ${folder} - ${name}: ${tags} IP: ${req.ip} token = ${token}`)
    res.status(200).end()
})

// 删除 tag
delRouter.post('/', bodyParser.json(), authorizeMiddleware, (req, res) => {
    const { folder, name, tag, token } = req.body as { folder: string, name: string, tag: string, token: any }

    const configPath = path.join(configDir, `${folder}.json`)
    if (!fs.existsSync(configPath)) return res.status(404).end()

    const tagData: Record<string, string[]> = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    if (tagData[name]) {
        tagData[name] = tagData[name].filter(t => t !== tag)
        fs.writeFileSync(configPath, JSON.stringify(tagData, null, 2))
    }
    console.log(`[DEL] del tag of ${folder} - ${name}: ${tag} IP: ${req.ip} token = ${token}`)
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
