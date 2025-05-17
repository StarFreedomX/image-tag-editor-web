import { authorizeMiddleware } from "@/authorizeMiddleware";
import path from "path";
import fs from "fs";
import {imageDir} from "@/app";
import express from "express";
const router = express.Router();
router.get('/:folder/:filename', authorizeMiddleware, (req, res) => {
    const { folder, filename } = req.params;
    const imagePath = path.join(imageDir, folder, filename);
    if (!fs.existsSync(imagePath)) {
        return res.status(404).send('Not Found');
    }
    res.sendFile(imagePath);
});
export {router as getImageRouter};