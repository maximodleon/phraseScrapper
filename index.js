'user strict'

const puppeteer = require('puppeteer')
const fs = require('fs')
const BASE_URL = 'https://www.frasesde.org'
const CATEGORY_BASE_URL = `${BASE_URL}/frases-de-`
const { log } = console

const getContent = async (browser) => {
  const categories = await getCategories()
  const ws = fs.createWriteStream('phrases.json')
  log('waiting for category phrases to come back....')
  const phrases = await Promise.all(
      categories.map(async (category) => { 
         try{
           const phrases = await getCategoryPhrases(category, browser) 
           return { categoryName: category, phrases }
        } catch(error) { log(error) }
  }))
  browser.close()
  log('got the results back!')

  const phrasesObject = phrases.filter((phrase) => phrase)
   .map((category) => { 
       return category.phrases.map((phrase) => { 
         //log(phrase)
         const obj = {
           author: phrase.substring(phrase.indexOf('(')).trim().replace(')', '').replace('(', ''),
           phrase: phrase.substring(0, phrase.indexOf('(')),
           category: category.categoryName 
         }
        return obj
    })
 })

  log([].concat.apply([], phrasesObject))
}

const getCategories = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(BASE_URL);
  const links = await page.evaluate(() => {
    const listElements = [...document.querySelectorAll('center>table>tbody>tr>td')]
    const  elementsString = listElements.map((td) => td.textContent.trim().toLowerCase())
    return elementsString[0].split('\n')
  })

  // remover los enalces que estan vacios ' '
  const cleanLinks = links.filter((link) => link.length > 2)
  await browser.close()
  return cleanLinks
}

const getCategoryPhrases = async (category, browser) => {
 const page = await browser.newPage();
 const url = `${CATEGORY_BASE_URL}${category}.php`
 await page.goto(url, { timeout: 0 });
 return await page.evaluate(() => {
   const divs = [...document.querySelectorAll('li')]
   return divs.map((li) =>  li.textContent.trim())
 })
}

(async () => {
  const browser = await puppeteer.launch();
  await getContent(browser)
})()
//f()
