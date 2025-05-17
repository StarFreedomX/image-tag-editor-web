import fs from "fs";
import path from "path";
import express from "express";
import {imageDir} from "@/app"
const router = express.Router();

router.get('/', (req, res) => {
    const folders = fs.readdirSync(imageDir).filter(f => fs.statSync(path.join(imageDir, f)).isDirectory());

    let html = `
  <html lang="zh">
    <head>
      <title>语录导航</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          background-color: #121212;
          color: #eee;
          font-family: sans-serif;
          padding: 40px 20px;
          max-width: 600px;
          margin: auto;
          text-align: center;
        }
        h1 {
          font-size: 2em;
          margin-bottom: 30px;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          margin: 15px 0;
        }
        a {
          text-decoration: none;
          color: #80cbc4;
          font-size: 1.2em;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 10px 20px;
          display: inline-block;
          transition: background 0.2s;
        }
        a:hover {
          background-color: #1e1e1e;
        }
      </style>
    </head>
    <body>
      <h1>语录导航</h1>
      <ul>
        ${folders.map(folder => `<li><a href="/groups/${folder}">${folder}</a></li>`).join('')}
      </ul>
    </body>
  </html>
  `;

    res.send(html);
});

export { router as mainPageRouter }