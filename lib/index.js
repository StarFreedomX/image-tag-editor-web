// image-tag-server.ts
import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const config = JSON.parse(fs.existsSync('./config.json') ? fs.readFileSync('./config.json', 'utf-8') : '{}');
const imageDir = path.isAbsolute(config.imageFolderPath)
    ? config.imageFolderPath
    : path.join(__dirname, config.imageFolderPath);
const configDir = path.isAbsolute(config.tagConfigOutputPath)
    ? config.tagConfigOutputPath
    : path.join(__dirname, config.tagConfigOutputPath);
if (!fs.existsSync(configDir))
    fs.mkdirSync(configDir);
app.use(bodyParser.json());
// app.use('/images', express.static(imageDir))
app.get('/images/:folder/:filename', (req, res) => {
    const { folder, filename } = req.params;
    const token = req.query.token;
    const valid = tokenAuthorized(folder, token);
    if (!valid) {
        return res.status(403).send('Forbidden');
    }
    //console.log(`[ACCESS] ${new Date().toISOString()} - ${username} accessed /images/${folder}/${filename}`);
    const imagePath = path.join(imageDir, folder, filename);
    if (!fs.existsSync(imagePath)) {
        return res.status(404).send('Not Found');
    }
    res.sendFile(imagePath);
});
app.get('/', (req, res) => {
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
        ${folders.map(folder => `<li><a href="/${folder}">${folder}</a></li>`).join('')}
      </ul>
    </body>
  </html>
  `;
    res.send(html);
});
// 获取图片和对应 tags
app.get('/:folder', (req, res) => {
    const { folder } = req.params;
    const folderPath = path.join(imageDir, folder);
    const tagPath = path.join(configDir, `${folder}.json`);
    //const folders = fs.readdirSync(imageDir).filter(f => fs.statSync(path.join(imageDir, f)).isDirectory() && f == folder)
    if (!fs.existsSync(folderPath)) {
        return res.status(404).send('No folder found.');
    }
    const token = req.query.token;
    const valid = tokenAuthorized(folder, token);
    // HTML 页面初始部分
    let htmlinit = `
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>${folder}</title>
      <style>
        body {
          font-family: sans-serif;
          background-color: #121212;
          color: #eee;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        #message {
          text-align: center;
        }
        input, button {
          padding: 8px;
          margin-top: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background-color: #222;
          color: #eee;
        }
      </style>
    </head>
    <body>
  `;
    if (!token || !valid) {
        // 缺少或错误 token，返回空页面+提示输入
        const message = token ? 'Token 错误，请重新输入。' : '请输入访问 token：';
        htmlinit += `
      <div id="message">
        <h2>${message}</h2>
        <input id="token-input" placeholder="输入 token" />
        <br />
        <button onclick="submitToken()">提交</button>
      </div>
      <script>
        function submitToken() {
          const token = document.getElementById('token-input').value;
          if (!token) return alert('请输入 token');
          const url = new URL(window.location.href);
          url.searchParams.set('token', token);
          window.location.href = url.toString();
        }
      </script>
    </body>
    </html>
    `;
        return res.send(htmlinit);
    }
    let html = `
  <html lang="zh">
  <head>
    <title>starfx-memebox</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    <style>
    body {
      font-family: sans-serif;
      max-width: 960px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      background-color: #121212;
      color: #eee;
    }
    .img-block {
      background-color: #1e1e1e;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .img-grid {
      display: grid;
      /*grid-template-columns: repeat(4, 1fr);*/
      gap: 20px;
      align-items: stretch;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
    img {
      width: 100%;
      display: block;
      margin: 0 auto;
      cursor: pointer;
      border-radius: 8px;
    }
    .tags {
      margin: 10px 0;
    }
    .tag {
      display: inline-block;
      background: #333;
      color: #eee;
      border-radius: 12px;
      padding: 4px 10px;
      margin: 3px;
      font-size: 14px;
      cursor: pointer;
    }
    form {
      display: inline-block;
      margin-top: 10px;
    }
    input[type="text"] {
      background: #222;
      border: 1px solid #555;
      color: #eee;
      padding: 6px 10px;
      border-radius: 6px;
    }
    button {
      background: #333;
      border: 1px solid #666;
      color: #eee;
      padding: 6px 12px;
      margin-left: 8px;
      margin-top: 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    button:hover {
      background: #444;
    }
    .modal {
      display: none;
      position: fixed;
      z-index: 999;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0,0,0,0.7);
      justify-content: center;
      align-items: center;
    }
    .modal-content {
      background: #1e1e1e;
      padding: 20px;
      border-radius: 10px;
      max-width: 95vw;
      max-height: 90vh;
      overflow: auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .modal-content img {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
      display: block;
    }
    .modal.show {
      display: flex;
    }
    #back-button {
      position: fixed;
      top: 20px;
      left: 20px;
      font-size: 24px;
      text-decoration: none;
      background: #222;
      color: #eee;
      padding: 6px 12px;
      border-radius: 8px;
      box-shadow: 0 0 5px rgba(0,0,0,0.4);
      z-index: 1000;
      transition: background 0.2s;
    }
    #back-button:hover {
      background: #333;
    }

  /* 适配手机屏幕：字体放大，内边距加大 */
    @media (max-width: 600px) {
      body {
        padding: 10px;
        font-size: 16px;
      }
    
      .img-block {
        padding: 12px;
      }
    
      input[type="text"], button {
        font-size: 16px;
        padding: 8px 12px;
      }
    
      .tag {
        font-size: 15px;
        padding: 5px 10px;
      }
    }
    </style>

  </head>
  <body>
  <a href="/" id="back-button" title="返回主页">←</a>
   <div id="img-modal" class="modal" onclick="closeModal(event)">
     <div class="modal-content" onclick="event.stopPropagation()">
       <img id="modal-image" src="" alt=""/>
       <div id="modal-tags" class="tags"></div>
     </div>
   </div>
  `;
    let tags = {};
    if (fs.existsSync(tagPath))
        tags = JSON.parse(fs.readFileSync(tagPath, 'utf-8'));
    html += `<h2>${folder}</h2><div class="img-grid">`;
    fs.readdirSync(folderPath).reverse().forEach(file => {
        const filePath = `/images/${folder}/${file}`;
        const key = path.parse(file).name;
        const currentTags = tags[key] || [];
        html += `
      <div class="img-block" id="img-${folder}-${key}">
        <img src="${filePath}?token=${token}" loading="lazy" onclick="openModal('${filePath}', '${folder}', '${key}')" alt = ${folder}-${key}/>
        <div class="tags" id="tags-${folder}-${key}">
          ${currentTags.map(tag => `<span class="tag" onclick="deleteTag('${folder}', '${key}', '${tag}')">${tag} ✕</span>`).join('')}
        </div>
        <form method="POST" action="/tag" onsubmit="return tagSubmit(this, '${folder}', '${key}')">
          <input type="hidden" name="folder" value="${folder}" />
          <input type="hidden" name="name" value="${key}" />
          <input type="text" name="tags" placeholder="tag1, tag2" autocomplete="off"/>
          <button type="submit">添加标签</button>
        </form>
      </div>
      `;
    });
    html += `
</div>
  <script>
    async function deleteTag(folder, name, tag) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

      await fetch('/delete-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, name, tag, token })
      })
      //location.reload()
      updateTags(folder, name)
    }

    function tagSubmit(form, folder, key) {
        const formData = new FormData(form);
  
        const input = form.querySelector('input[name="tags"]')
        const tags = input?.value.trim()

        if (!tags) return false  // 空值不提交
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const params = new URLSearchParams(formData);

        // 添加 token 参数
        if (token) params.append('token', token);
        
        fetch('/tag', {
            method: 'POST',
            body: params
        }).then(() => {
            const el = document.getElementById(\`img-\${folder}-\${key}\`);
            if (el) {
                input.value = ''  // 清空输入框
                // 更新该图片的标签列表
                updateTags(folder, key);
                // 滚动到图片的位置
                //el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        })
        return false;
    }
    function updateTags(folder, key) {
        const tagContainer = document.getElementById(\`tags-\${folder}-\${key}\`);
        console.log(tagContainer);
        if (!tagContainer) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');            
        // 发起请求获取最新的标签数据
        fetch(\`/tags/\${folder}/\${key}?token=\${token}\`)
         .then(res => res.json())
          .then(tags => {
            
            // 更新标签列表
            tagContainer.innerHTML = tags.map(tag => 
                \`<span class="tag" onclick="deleteTag('\${folder}', '\${key}', '\${tag}')">\${tag} ✕</span>\`
            ).join('');
          });
    }
    
    function openModal(src, folder, key) {
        const tagContainer = document.getElementById(\`tags-\${folder}-\${key}\`);
        console.log(tagContainer);
        const tags = Array.from(tagContainer?.getElementsByClassName('tag') || []).map(
            el => el.textContent.replace(' ✕', '').trim()
        )
        const modal = document.getElementById('img-modal')
        const modalImg = document.getElementById('modal-image')
        const modalTags = document.getElementById('modal-tags')
        modalImg.src = src
        modalTags.innerHTML = tags.map(t => \`<span class='tag'>\${t}</span>\`).join('')
        modal.classList.add('show')
    }

    function closeModal(event) {
        const modal = document.getElementById('img-modal')
        if (event.target === modal) modal.classList.remove('show')
    }


  </script>
  </body>
  </html>
  `;
    res.send(html);
});
// 添加 tag
app.post('/tag', express.urlencoded({ extended: true }), (req, res) => {
    const { folder, name, tags, token } = req.body;
    //验证token
    const valid = tokenAuthorized(folder, token);
    if (!valid)
        return res.status(403).send('Invalid token');
    const configPath = path.join(configDir, `${folder}.json`);
    let tagData = {};
    if (fs.existsSync(configPath))
        tagData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!tagData[name])
        tagData[name] = [];
    tagData[name].push(...tagList);
    tagData[name] = Array.from(new Set(tagData[name]));
    fs.writeFileSync(configPath, JSON.stringify(tagData, null, 2));
    res.status(200).end();
});
// 删除 tag
app.post('/delete-tag', express.json(), (req, res) => {
    const { folder, name, tag, token } = req.body;
    //验证token
    const valid = tokenAuthorized(folder, token);
    if (!valid)
        return res.status(403).send('Invalid token');
    //console.log(`[DELETE TAG] ${new Date().toISOString()} - ${valid} delete ${folder}-${name} tag: ${tag}`)
    const configPath = path.join(configDir, `${folder}.json`);
    if (!fs.existsSync(configPath))
        return res.status(404).end();
    const tagData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (tagData[name]) {
        tagData[name] = tagData[name].filter(t => t !== tag);
        fs.writeFileSync(configPath, JSON.stringify(tagData, null, 2));
    }
    res.status(200).end();
});
app.get('/tags/:folder/:key', (req, res) => {
    const { folder, key } = req.params;
    //验证token
    const token = req.query?.token;
    const valid = tokenAuthorized(folder, token);
    if (!valid)
        return res.status(403).send('Invalid token');
    const configPath = path.join(configDir, `${folder}.json`);
    if (!fs.existsSync(configPath))
        return res.status(404).send([]);
    const tagData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const tags = tagData[key] || [];
    res.json(tags);
});
function tokenAuthorized(folder, token) {
    const isAdmin = config?.tokens?.admin?.[token];
    if (isAdmin)
        return isAdmin;
    const expectedTokens = config?.tokens?.[folder];
    return expectedTokens?.[token];
}
app.listen(config.port || 3567, config.ip || '127.0.0.1', () => {
    console.log(`✅ 本地图片标签服务已启动: http://localhost:${config.port}`);
});
