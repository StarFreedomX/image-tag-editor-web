// 获取图片和对应 tags
import path from "path";
import fs from "fs";
import {configDir, imageDir} from "@/app";
import {tokenAuthorized} from "@/authorizeMiddleware";
import express from "express";
const router = express.Router();
router.get('/:folder', (req, res) => {
    const { folder } = req.params;
    const folderPath = path.join(imageDir, folder)
    const tagPath = path.join(configDir, `${folder}.json`)
    if (!fs.existsSync(folderPath)) {return res.status(404).send('No folder found.')}
    const token = req.query.token;
    const valid = tokenAuthorized(folder, token);

    if (!token || !valid) {
        // 缺少或错误 token，返回空页面+提示输入
        return res.render('inputToken', {
            folder,
            message: (token ? 'Token 错误，请重新输入。' : '请输入访问 token：')
        });
    }

    const tags: Record<string, string[]> = fs.existsSync(tagPath)
        ? JSON.parse(fs.readFileSync(tagPath, 'utf-8'))
        : {};
    const images = fs.readdirSync(folderPath).reverse().map(file => {
        const fileName = path.parse(file).name;
        return {
            imgSrc: `/images/${folder}/${file}`,
            fileName: fileName,
            tags: tags[fileName] || [],
        };
    });
    res.render('folder', {
        folder,
        images,
        token,
    });
})


export {router as folderRouter}