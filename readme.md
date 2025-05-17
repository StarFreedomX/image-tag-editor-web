# image-tag-editor-web

适用于于Koishi插件 [koishi-plugin-starfx-bot]((https://github.com/StarFreedomX/starfx-bot)) 的语录功能

# 启动方式
安装项目及依赖
```shell
#克隆本仓库
git clone https://github.com/StarFreedomX/image-tag-editor-web.git
cd image-tag-editor-web
#安装依赖
npm install
#进入config.json调整配置
#运行项目(可能会要求安装npx tsx等，跟随引导安装即可)
npm start
```


# config配置
```ts
export interface Config {
    ip: string,//监听的ip，127.0.0.1为本地访问，0.0.0.0为网络访问
    port: number,//监听的端口
    //Windows默认填"%AppData%\Koishi\Desktop\data\instances\default\data\starfx-bot\assets\record"
    imageFolderPath: string,//图片目录，需要注意图片文件是在子文件夹中
    //Windows默认填"%AppData%\Koishi\Desktop\data\instances\default\data\starfx-bot\assets\tagConfig"
    tagConfigOutputPath: string,//输出tag配置目录
    tokens: {
        /*
            这是token配置目录
            folder为image目录子文件夹名称
            例如
            "ontbot_999888777": {
                "Senrenbanka": "zhaomaoniu",
                "CSGO": "eeee"
            }
            还提供了一个管理员账户，如
            "admin": {
                "114514": "admin~"
            }
        */
        [folder: string]: {
            [token: string]: string; // token -> username
        };
    };
}
```
需要注意imageFolderPath的路径
```
assets/record/     <-填record目录
        ├─ onebot_999888777/
        │   ├─20250428-1.jpg
        │   ├─20250428-2.jpg
        │   └─......
        └─......
```
