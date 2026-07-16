// 获取图片和对应 tags
import path from "path";
import fs from "fs";
import {configDir, imageDir} from "@/app";
import {tokenAuthorized, getUserRole} from "@/authorizeMiddleware";
import { Router } from "express";
const router: Router = Router();
router.get('/:folder', (req, res) => {
    const { folder } = req.params;
    const folderPath = path.join(imageDir, folder)
    const tagPath = path.join(configDir, `${folder}.json`)
    if (!fs.existsSync(folderPath)) {
        return res.status(404).render('404', { message: '目录不存在：' + folder });
    }
    const rawToken = req.cookies?.starfx_token || '';
    const token = typeof rawToken === 'string' && rawToken.startsWith('sfx_') ? rawToken : '';
    const valid = tokenAuthorized(folder, token);

    if (!token || !valid) {
        return res.render('login', { error: token ? 'Token 无权限访问该群' : '' });
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
        role: getUserRole(String(token)),
    });
})


export {router as folderRouter}
