import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { loadNotifications } from '../../actions/notifications'
import StreamComponent from '../../components/streams/StreamComponent'
import {
  BubbleIcon,
  HeartIcon,
  RepostIcon,
  RelationshipIcon,
} from '../../components/notifications/NotificationIcons'
import TabListLinks from '../../components/tabs/TabListLinks'

class Notifications extends Component {

  render() {
    const { pathname } = this.props
    const { category } = this.props.params
    const params = {}
    if (category) {
      params.category = category
    }
    const tabs = [
      { to: '/notifications', children: 'All' },
      { to: '/notifications/comments', children: <BubbleIcon /> },
      { to: '/notifications/loves', children: <HeartIcon /> },
      { to: '/notifications/mentions', children: '@' },
      { to: '/notifications/reposts', children: <RepostIcon /> },
      { to: '/notifications/relationships', children: <RelationshipIcon /> },
    ]
    return (
      <section className="Notifications Panel">
        <TabListLinks
          activePath={pathname}
          className="IconTabList"
          tabClasses="IconTab"
          tabs={tabs}
        />
        <StreamComponent action={loadNotifications(params)} />
      </section>
    )
  }
}

Notifications.preRender = (store, routerState) => {
  const { category } = routerState.params
  const params = {}
  if (category) {
    params.category = category
  }
  return store.dispatch(loadNotifications(params))
}

Notifications.propTypes = {
  pathname: PropTypes.string,
  params: PropTypes.shape({
    category: PropTypes.string,
  }),
}

function mapStateToProps(state) {
  return {
    pathname: state.routing.location.pathname,
  }
}

export default connect(mapStateToProps)(Notifications)

