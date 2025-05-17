
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
    //const folders = fs.readdirSync(imageDir).filter(f => fs.statSync(path.join(imageDir, f)).isDirectory() && f == folder)
    console.log('folder path:', folderPath);
    if (!fs.existsSync(folderPath)) {return res.status(404).send('No folder found.')}
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
  `



    let tags: Record<string, string[]> = {}
    if (fs.existsSync(tagPath)) tags = JSON.parse(fs.readFileSync(tagPath, 'utf-8'))

    html += `<h2>${folder}</h2><div class="img-grid">`

    fs.readdirSync(folderPath).reverse().forEach(file => {
        const filePath = `/images/${folder}/${file}`
        const key = path.parse(file).name
        const currentTags = tags[key] || []
        html += `
      <div class="img-block" id="img-${folder}-${key}">
        <img src="${filePath}?token=${token}" loading="lazy" onclick="openModal('${filePath}?token=${token}', '${folder}', '${key}')" alt = ${folder}-${key}/>
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
      `
    })

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
  `

    res.send(html)
})


export {router as folderRouter}