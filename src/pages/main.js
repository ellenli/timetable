import React from 'react'
import NavHelper from '../components/nav-helper'
import Header from '../components/header'
import SideBar from '../components/sidebar'
import Calendar from '../components/calendar'

export default React.createClass({
  render () {
    return (
      <NavHelper className='container'>
        <Header />
        <SideBar />
        <Calendar />
      </NavHelper>
    )
  }
})
