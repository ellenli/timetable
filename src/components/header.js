import app from 'ampersand-app'
import React from 'react'
import localLinks from 'local-links'

export default React.createClass({
  displayName: 'NavHelper',

  onClick (event) {
    const pathname = localLinks.getLocalPathname(event)

    if (pathname) {
      event.preventDefault()
      app.router.history.navigate(pathname)
    }
  },

  render () {
    return (
      <div {...this.props} onClick={this.onClick}>
        <h1>Header</h1>

        <select name="" id="">
          <option value="Value 1">Value 1</option>
          <option value="Value 2">Value 2</option>
          <option value="Value 3">Value 3</option>
        </select>

        {this.props.children}
      </div>
    )
  }
})
