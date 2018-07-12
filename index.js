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
           return { categoryName: category, phrases: await getCategoryPhrases(category, browser) }
        } catch(error) { }
  }))

  log('got the results back!')

  const phrasesObject = phrases.map((category) => { 
   if (!category || !category.phrases) return;
   category.phrases.map((phrase) => { 
    const phraseParts = phrase.split(/\.|\?|\!/)
    return {
      author: phraseParts[1].trim().replace(')', '').replace('(', ''),
      phrase: phraseParts[0],
      category: category.categoryName 
    }
  })
 })

  console.log(phrasesObject)
  browser.close()
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
 await page.goto(url);
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
