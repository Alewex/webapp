import Immutable from 'immutable'
import React from 'react'
import CategoryContainer from '../../containers/CategoryContainer'
import CommentContainer from '../../containers/CommentContainer'
import NotificationContainer from '../../containers/NotificationContainer'
import PostContainer from '../../containers/PostContainer'
import UserContainer from '../../containers/UserContainer'
import { SlickCarousel } from '../../components/carousels/CarouselRenderables'
import EditorialLayout from '../../components/editorials/EditorialLayout'
import Preference from '../../components/forms/Preference'
import TreeButton from '../../components/navigation/TreeButton'
import TreePanel from '../../components/navigation/TreePanel'
import { preferenceToggleChanged } from '../../helpers/junk_drawer'
import { isElloAndroid } from '../../lib/jello'
import { css, media, select } from '../../styles/jss'
import * as s from '../../styles/jso'

// categories/comments/posts/users all get passed an Immutable.List
// which contains ids required for their respective containers to
// do their own lookup in the store to ensure they are up to date
// CATEGORIES

const categoriesStyle = css(
  s.flex,
  s.flexRow,
  s.flexWrap,
  s.mt10,
  { marginLeft: -20 },
  media(s.minBreak4, s.mt20, { marginLeft: -40 }),
)

export const categoriesAsGrid = categoryIds =>
  (<div className={categoriesStyle}>
    {categoryIds.map(id =>
      (<CategoryContainer
        categoryId={id}
        key={`categoryGrid_${id}`}
      />),
    )}
  </div>)

// COMMENTS
export const commentsAsList = commentIds =>
  (<div className="Comments">
    {commentIds.map(id =>
      (<CommentContainer
        commentId={id}
        key={`commentContainer_${id}`}
      />),
    )}
  </div>)

// EDITORIAL: chunk layouts into pages of 24 editorials
export const editorials = editorialIds => (
  Immutable.Range(0, editorialIds.size - 1, 24)
    .map(chunkStart => editorialIds.slice(chunkStart, chunkStart + 24))
    .map(pageIds => <EditorialLayout key={pageIds} ids={pageIds} />)
)

export const postsAsPostStream = (postIds, columnCount, isPostHeaderHidden, renderProps) => (
  <SlickCarousel postIds={postIds} renderProps={renderProps} />
)

// POSTS
export const postsAsGrid = (postIds, columnCount, isPostHeaderHidden) => {
  const columns = []
  for (let i = 0; i < columnCount; i += 1) { columns.push([]) }
  postIds.forEach((value, index) => columns[index % columnCount].push(postIds.get(index)))
  return (
    <div className="Posts asGrid">
      {columns.map((columnPostIds, i) =>
        (<div className="Column" key={`column_${i + 1}`}>
          {columnPostIds.map(id =>
            (<article className="PostGrid" key={`postsAsGrid_${id}`}>
              <PostContainer postId={id} isPostHeaderHidden={isPostHeaderHidden} />
            </article>),
          )}
        </div>),
      )}
    </div>
  )
}

const postListStyle = css(
  s.maxSiteWidth,
  s.mxAuto,
  select('& .ImageRegion img', { height: 'auto' }),
)

export const postsAsList = (postIds, columnCount, isPostHeaderHidden) => (
  <div className={`Posts asList ${postListStyle}`}>
    {postIds.map(id => (
      <article className="PostList" key={`postsAsList_${id}`}>
        <PostContainer postId={id} isPostHeaderHidden={isPostHeaderHidden} />
      </article>
    ))}
  </div>
)

export const postsAsRelated = (postIds, columnCount, isPostHeaderHidden) => {
  const columns = []
  for (let i = 0; i < columnCount; i += 1) { columns.push([]) }
  postIds.forEach((value, index) => columns[index % columnCount].push(postIds.get(index)))
  return (
    <div className="Posts asGrid">
      {postIds.size &&
        <div className="RelatedPostsTitleWrapper">
          <h2 className="RelatedPostsTitle">
            Related Posts
          </h2>
        </div>
      }
      {columns.map((columnPostIds, i) =>
        (<div className="Column" key={`column_${i + 1}`}>
          {columnPostIds.map(id =>
            (<article className="PostGrid" key={`postsAsGrid_${id}`}>
              <PostContainer postId={id} isPostHeaderHidden={isPostHeaderHidden} isRelatedPost />
            </article>),
          )}
        </div>),
      )}
    </div>
  )
}

// USERS
export const usersAsCompact = userIds =>
  userIds.map(id =>
    (<UserContainer
      key={`userCompact_${id}`}
      type="compact"
      userId={id}
    />),
  )

export const usersAsGrid = userIds =>
  (<div className="Users asGrid">
    {userIds.map(id =>
      (<UserContainer
        key={`userGrid_${id}`}
        type="grid"
        userId={id}
      />),
    )}
  </div>)

export const usersAsInviteeList = invitationIds =>
  (<div className="Users asInviteeList">
    {invitationIds.map(id =>
      (<UserContainer
        invitationId={id}
        key={`userInviteeList_${id}`}
        type="invitee"
      />),
    )}
  </div>)

export const usersAsInviteeGrid = invitationIds =>
  (<div className="Users asInviteeGrid">
    {invitationIds.map(id =>
      (<UserContainer
        className="UserInviteeGrid"
        invitationId={id}
        key={`userInviteeGrid_${id}`}
        type="invitee"
      />),
    )}
  </div>)


// notifications and settings don't have an id so they are
// preserved in the order received by using a stream filter
// and the models are passed directly to these methods
// NOTIFICATIONS
export const notificationList = notifications =>
  (<div className="Notifications">
    {notifications.map((notification, i) =>
      (<NotificationContainer
        key={`notificationParser_${notification.get('createdAt', Date.now())}_${i + 1}`}
        notification={notification}
      />),
    )}
  </div>)

// SETTINGS
export const profileToggles = settings =>
  settings.map((setting, index) => {
    if (!isElloAndroid() && setting.get('label').toLowerCase().indexOf('push') === 0) { return null }
    const arr = [<TreeButton key={`settingLabel_${setting.get('label')}`}>{setting.get('label')}</TreeButton>]
    arr.push(
      <TreePanel key={`settingItems_${setting.get('label', index)}`}>
        {setting.get('items').map(item =>
          (<Preference
            definition={{ term: item.get('label'), desc: item.get('info') }}
            id={item.get('key')}
            key={`preference_${item.get('key')}`}
            onToggleChange={preferenceToggleChanged}
          />),
        )}
      </TreePanel>,
    )
    return arr
  })

