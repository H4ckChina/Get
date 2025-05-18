const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');

// 获取 XMR 价格的函数
async function getXMRPrice() {
    try {
        const url = 'https://www.google.com/finance/quote/XMR-CNY';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        // Google Finance 的价格通常在 class="YMlKec fxKbKc" 的元素中
        const priceText = $('.YMlKec.fxKbKc').first().text();
        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        
        // 取整数部分
        return Math.floor(price);
    } catch (error) {
        console.error('获取价格失败:', error.message);
        return null;
    }
}

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
        const price = await getXMRPrice();
        
        if (price !== null) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`XMR:${price}`);
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('无法获取XMR价格');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// 监听 80 端口
const PORT = 80;
server.listen(PORT, () => {
    console.log(`服务已运行 http://Get.ookk.us:${PORT}/`);
});
