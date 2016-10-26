require('babel/register')
var getConfig  = require('hjs-webpack')
var React      = require('react')
var MainPage = require('./src/pages/main')
var Layout     = require('./src/layout')

module.exports = getConfig({
  in: 'src/app.js',
  out: 'public',
  clearBeforeBuild: true,
  html: function (context) {
    const main = React.renderToString(React.createElement(MainPage))
    const layoutPage = React.renderToString(React.createElement(Layout, {me: {}}))

    return {
      'index.html': context.defaultTemplate({html: main}),
      '200.html': context.defaultTemplate({html: layoutPage})
    }
  }
})
