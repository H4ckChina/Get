const https = require('https');
const axios = require('axios');
const express = require('express');
const cheerio = require('cheerio'); // 用于解析 HTML

const app = express();
const port = 80;

// 全局缓存 XMR 价格
let cachedXmrPriceInCny = null;

// 定义函数用于更新 XMR 价格
async function updateXmrPrice() {
  try {
    const financeResponse = await axios.get(
      'https://www.google.com/finance/quote/XMR-CNY?sa=X&ved=2ahUKEwiQ2eD4wYCNAxWfc_UHHVxtCjEQ-fUHegQIARAc',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        }
      }
    );
    // 使用 cheerio 解析 HTML 并提取价格
    const $ = cheerio.load(financeResponse.data);
    let priceText = $('.YMlKec.fxKbKc').first().text();
    if (!priceText) {
      console.error('无法获取XMR的最新价格');
      return;
    }
    // 更新全局缓存价格
    cachedXmrPriceInCny = parseFloat(priceText.replace(/[^0-9\.]/g, ''));
  } catch (error) {
    console.error(`获取XMR价格时出错: ${error.message}`);
  }
}

// 初始调用一次
updateXmrPrice();

// 每隔10分钟更新一次 XMR 价格
setInterval(updateXmrPrice, 10 * 60 * 1000);

app.get('/', async (req, res) => {
  try {
    // 如果还未获取到价格数据，则返回错误
    if (cachedXmrPriceInCny === null) {
      return res.status(500).send('XMR 价格数据尚未更新，请稍后再试');
    }

    // 使用 SupportXMR API 获取矿工统计数据
    const walletAddress = '43GwHc4GFav8wNS9UPFJfbCoyVMo6g6DLdjpBj6hboND58BxHm24T9nJvegPxsd7YXJAFF63h8PJzLnsCw3oJJ6yRtN91Yj';

    https.get(`https://supportxmr.com/api/miner/${walletAddress}/stats`, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      apiRes.on('end', () => {
        try {
          let minerStats = JSON.parse(data);

          // 根据当前算力自动选择显示单位：KH/s 或 MH/s
          if (minerStats.hash < 1000000) {
            minerStats.hashrate = (minerStats.hash / 1000).toFixed(2) + ' KH/s';
          } else {
            minerStats.hashrate = (minerStats.hash / 1000000).toFixed(2) + ' MH/s';
          }

          // 转换未付金额和已付金额，保留三位小数
          minerStats.amtDue = (minerStats.amtDue / Math.pow(10, 12)).toFixed(3);
          minerStats.amtPaid = (minerStats.amtPaid / Math.pow(10, 12)).toFixed(3);

          // 加入当前 XMR 的价格（单位：CNY），保留两位小数
          minerStats.xmrPriceInCny = cachedXmrPriceInCny.toFixed(2);

          // 返回处理后的数据
          const result = {
            hashrateInKHOrMH: minerStats.hashrate,
            amtDueInXMR: minerStats.amtDue,
            amtPaidInXMR: minerStats.amtPaid,
            xmrPriceInCny: minerStats.xmrPriceInCny
          };

          res.json(result);
        } catch (err) {
          console.error(`解析矿工统计数据错误: ${err.message}`);
          res.status(500).send("解析矿工数据时出错");
        }
      });
    }).on('error', (err) => {
      console.error(`Error: ${err.message}`);
      res.status(500).send("从 SupportXMR 获取数据时出错");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(`获取数据时出错: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
