import app    from 'ampersand-app'
import Router from 'ampersand-router'
import React  from 'react'
import qs     from 'qs'
import xhr    from 'xhr'
import config from './config'

// React pages
import Layout      from './layout'
import MainPage  from './pages/main'
import MessagePage from './pages/message'

export default Router.extend({
  renderPage (page, opts = {layout: true}) {
    if (opts.layout) {
      page = (
        <Layout me={app.me}>
          {page}
        </Layout>
      )
    }

    React.render(page, document.body)
  },

  routes: {
    '': 'public',
    '*fourOhfour': 'fourOhfour'
  },

  public () {
    this.renderPage(<MainPage/>, {layout: false})
  },

  fourOhfour () {
      this.renderPage(<MessagePage title='Not Found' body='sorry nothing here'/>) }
})
