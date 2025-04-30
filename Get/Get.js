const https = require('https');
const axios = require('axios');
const express = require('express');
const cheerio = require('cheerio'); // 使用 cheerio 解析 HTML

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  try {
    // 使用 Google Finance 获取 XMR 对 CNY 的价格
    const financeResponse = await axios.get(
      'https://www.google.com/finance/quote/XMR-CNY?sa=X&ved=2ahUKEwiQ2eD4wYCNAxWfc_UHHVxtCjEQ-fUHegQIARAc',
      {
        headers: {
          // 模拟浏览器请求头，防止被拒绝
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        }
      }
    );

    // 解析返回的 HTML 并提取价格，选择器根据当前 Google Finance 页面结构指定
    const $ = cheerio.load(financeResponse.data);
    let priceText = $('.YMlKec.fxKbKc').first().text();
    if (!priceText) {
      throw new Error('无法获取XMR的最新价格');
    }
    // 去除非数字字符后转换为数值
    let priceInCny = parseFloat(priceText.replace(/[^0-9\.]/g, ''));

    // 使用 SupportXMR API 获取矿工统计数据
    const walletAddress = '43GwHc4GFav8wNS9UPFJfbCoyVMo6g6DLdjpBj6hboND58BxHm24T9nJvegPxsd7YXJAFF63h8PJzLnsCw3oJJ6yRtN91Yj';
    https.get(`https://supportxmr.com/api/miner/${walletAddress}/stats`, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });
      apiRes.on('end', () => {
        let minerStats = JSON.parse(data);

        // 根据当前算力自动选择显示为 KH/s 或 MH/s
        if (minerStats.hash < 1000000) {
          minerStats.hashrate = (minerStats.hash / 1000).toFixed(2) + ' KH/s';
        } else {
          minerStats.hashrate = (minerStats.hash / 1000000).toFixed(2) + ' MH/s';
        }

        // 将未付金额和已付金额转换为保留三位小数的形式
        minerStats.amtDue = (minerStats.amtDue / Math.pow(10, 12)).toFixed(3);
        minerStats.amtPaid = (minerStats.amtPaid / Math.pow(10, 12)).toFixed(3);

        // 添加当前 XMR 的价格（单位：CNY），保留两位小数
        minerStats.xmrPriceInCny = priceInCny.toFixed(2);

        // 返回需要的数据
        const result = {
          hashrateInKHOrMH: minerStats.hashrate,
          amtDueInXMR: minerStats.amtDue,
          amtPaidInXMR: minerStats.amtPaid,
          xmrPriceInCny: minerStats.xmrPriceInCny
        };

        res.json(result);
      });
    }).on('error', (err) => {
      console.error(`Error: ${err.message}`);
      res.status(500).send("从 SupportXMR 获取数据时出错");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(`获取价格时出错: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
