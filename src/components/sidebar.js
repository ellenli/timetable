import app from 'ampersand-app'
import React from 'react'
import localLinks from 'local-links'

export default React.createClass({

  onClick (event) {
    alert('register!')
  },

  render () {
    return (
      <div {...this.props} onClick={this.onClick}>
        <h1>Classes</h1>
        <ul>
          <li>BIO-1010</li>
          <li>BIO-1010</li>
          <li>BIO-1010</li>
        </ul>
      </div>
    )
  }
})
