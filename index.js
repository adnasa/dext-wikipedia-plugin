const request = require('request')
const qs = require('querystring')

const isDev = process.env.NODE_ENV === 'development'
const BASE_URL = 'https://en.wikipedia.org/w/api.php'

const queryObj = {
  titles: null,
  action: 'query',

  rvprop: 'content',
  rvparse: 1,
  rvlimit: 1,
  rvsection: 1,

  lllimit: 100,
  llprop: 'url',
  // @TODO: Investigate why we don't get the `en` link
  // For now, let's use swedish :D
  lllang: 'sv',

  format: 'json',
}

module.exports = {
  keyword: 'wiki',
  action: 'openurl',
  helper: {
    title: 'wikipedia',
    subtitle: 'Search through articles of wikipedia',
  },
  execute: q => new Promise(resolve => {
    const items = []

    if (!q) {
      resolve({ items })
      return
    }

    const searchObj = Object.assign({}, queryObj, { titles: q })
    const searchParams = qs.stringify(searchObj)
    const url = `${BASE_URL}?${searchParams}&prop=revisions|langlinks`

    request({ url }, (error, responseObj, body) => {
      const response = JSON.parse(body)

      if (error || response.error) {
        resolve({ items })
        return
      }

      const pages = mapToItem(response.query.pages)
      resolve({ items: pages })
    })
  }),

  details: {
    type: 'html',
    render,
  },
}

function render ({
  revisions,
}) {
  return revisions[0]['*']
}

function mapToItem (pages) {
  return Object.keys(pages).reduce((acc, pageId) => {
    const page = pages[pageId]
    const {
      title,
      langlinks,
    } = page

    const hasLanglinks = !!langlinks

    const item = {
      title,
      subtitle: hasLanglinks
        ? langlinks[0].url
        : title,
      // Somehow, some articles doesn't provide a langlink...
      arg: hasLanglinks
        ? langlinks[0].url
        : 'http://wikipedia.org',
      icon: {
        path: './icon.png',
      },
      context: page,
    }

    return acc.concat(item)
  }, [])
}
