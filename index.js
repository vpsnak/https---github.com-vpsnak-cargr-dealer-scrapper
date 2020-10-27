const fs = require('fs');
const config = require('./config.js')
const db = require('./storage.js');
const dealers = require('./dealers.js');
const dealerDetails = require('./dealer-details.js');

const puppeteer = require('puppeteer');

const scrapAndSaveData = () =>{
  dealers.populateDB(db)
    .then(() =>{
      console.log(db);
      fs.writeFile(config.db.file, JSON.stringify(db), function (err) {
        if (err) return console.log(err);
        console.log('Error saving data in db.json');
      });
    })
}

const saveDB = () => {
  return new Promise((resolve, reject) => {
    fs.writeFile(config.db.file, JSON.stringify(db), function (err) {
      if (err) {
        return reject(err);
      }
      console.log('Saved data in db.json');
      resolve();
    });
  })
}


const loadDB = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(config.db.file, (err, data) => {
        if (err) {
          scrapAndSaveData();
          return reject(err);
        }
        Object.assign(db, JSON.parse(data));
        resolve();
    });
  })
}

(async () => {
  await loadDB();
  console.log('Database ready to use!');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let index = 0;
  const dealerCount = db.dealers.length;
  for(const dealer of db.dealers){
    console.log('Progress: ' + (index++ / dealerCount) * 100 + '%');
    await page.goto(`${dealer.link}contact`,{ waitUntil: 'networkidle0'});
    const html = await page.content();
    dealerDetails.scrapDetails(dealer, html);
  }
  await saveDB();
  await browser.close();
})();