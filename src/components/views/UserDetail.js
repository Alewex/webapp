import React, { PropTypes } from 'react'
import Cover from '../assets/Cover'
import classNames from 'classnames'
import { UserDetailHelmet } from '../helmets/UserDetailHelmet'
import StreamComponent from '../streams/StreamComponent'
import UserList from '../users/UserList'
import { MainView } from '../views/MainView'
import { TabListButtons } from '../tabs/TabList'
import { ZeroStateCreateRelationship, ZeroStateFirstPost, ZeroStateSayHello } from '../zeros/Zeros'

const ZeroStates = ({
  isLoggedIn, isSelf, hasSaidHelloTo, hasZeroFollowers, hasZeroPosts, onSubmitHello, user,
  }) =>
  <div className="ZeroStates">
    {isSelf && hasZeroPosts ? <ZeroStateFirstPost /> : null}
    {!isSelf && hasZeroFollowers ? <ZeroStateCreateRelationship user={user} /> : null}
    {isLoggedIn && !isSelf && hasZeroPosts ?
      <ZeroStateSayHello
        onSubmit={() => onSubmitHello({ username: user.username })}
        hasPosted={hasSaidHelloTo}
        user={user}
      /> : null
    }
  </div>

ZeroStates.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  isSelf: PropTypes.bool.isRequired,
  hasSaidHelloTo: PropTypes.bool.isRequired,
  hasZeroFollowers: PropTypes.bool.isRequired,
  hasZeroPosts: PropTypes.bool.isRequired,
  onSubmitHello: PropTypes.func,
  user: PropTypes.object.isRequired,
}


export const UserDetail = (props) => {
  // deconstruct props
  const { isLoggedIn, isSelf, hasSaidHelloTo, hasZeroFollowers, hasZeroPosts } = props
  const { activeType, onSubmitHello, onTabClick, streamAction, tabs, user } = props
  const { coverDPI, coverImage, coverOffset, isCoverActive, isCoverHidden } = props
  const useGif = true

  // construct component props
  const coverProps = {
    coverDPI, coverImage, coverOffset, isHidden: isCoverHidden, isModifiable: isSelf, useGif,
  }
  const userListProps = { classList: 'asUserDetailHeader', showBlockMuteButton: true, useGif, user }
  const tabProps = { activeType, className: 'LabelTabList', tabClasses: 'LabelTab', tabs }
  const streamProps = { action: streamAction, isUserDetail: true }
  const zeroProps = {
    isLoggedIn, isSelf, hasSaidHelloTo, hasZeroFollowers, hasZeroPosts, onSubmitHello, user,
  }
  const classList = classNames('UserDetail', { isCoverInactive: !isCoverActive })

  return (
    <MainView className={classList}>
      <UserDetailHelmet user={user} />
      <div className="UserDetails">
        {isCoverActive ? <Cover {...coverProps} /> : null}
        <UserList {...userListProps} />
        {tabs ? <TabListButtons {...tabProps} onTabClick={({ type }) => onTabClick(type)} /> : null}
        {hasZeroPosts || hasZeroFollowers ? <ZeroStates {...zeroProps} /> : null}
        {streamAction ? <StreamComponent {...streamProps} /> : null}
      </div>
    </MainView>
  )
}

UserDetail.propTypes = {
  activeType: PropTypes.string,
  coverDPI: PropTypes.string,
  coverImage: PropTypes.shape({}),
  coverOffset: PropTypes.number,
  isCoverActive: PropTypes.bool.isRequired,
  isCoverHidden: PropTypes.bool,
  isLoggedIn: PropTypes.bool.isRequired,
  isSelf: PropTypes.bool.isRequired,
  hasSaidHelloTo: PropTypes.bool.isRequired,
  hasZeroFollowers: PropTypes.bool.isRequired,
  hasZeroPosts: PropTypes.bool.isRequired,
  onSubmitHello: PropTypes.func,
  onTabClick: PropTypes.func,
  streamAction: PropTypes.object,
  tabs: PropTypes.array,
  user: PropTypes.object.isRequired,
}


export const UserDetailError = ({ children }) =>
  <MainView className="UserDetail">
    <section className="StreamComponent hasErrored">
      {children}
    </section>
  </MainView>

UserDetailError.propTypes = {
  children: PropTypes.node.isRequired,
}

