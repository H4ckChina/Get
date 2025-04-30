# 安装依赖

wget https://nodejs.org/dist/v22.3.0/node-v22.3.0-linux-x64.tar.xz

tar -xvf node-v22.3.0-linux-x64.tar.xz

ln -s /root/node-v22.3.0-linux-x64/bin/node /usr/local/bin/node
ln -s /root/node-v22.3.0-linux-x64/bin/npm /usr/local/bin/npm

npm install axios
npm install express
npm install cheerio

## 快速复制 Ubuntu 命令

在终端运行以下命令：

```bash
sudo apt update && sudo apt upgrade -y
