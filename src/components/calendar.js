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
        <div style={{height:'400px', width:'400px', backgroundColor: 'grey'}}></div>
      </div>
    )
  }
})
