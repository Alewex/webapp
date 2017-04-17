import React, { PropTypes } from 'react'
import Editor from '../editor/Editor'
import PostContainer from '../../containers/PostContainer'
import StreamContainer from '../../containers/StreamContainer'
import { MainView } from '../views/MainView'
import { loadRelatedPosts } from '../../actions/posts'
import { RelatedPostsButton } from '../posts/PostRenderables'
import { TabListButtons } from '../tabs/TabList'
import { css } from '../../styles/jss'
import * as s from '../../styles/jso'
import * as ElloAndroidInterface from '../../lib/android_interface'

const navStyle = css(
  s.relative,
  { marginBottom: -10 },
)

export const PostDetail = (
  { activeType, columnCount, hasEditor, hasRelatedPostsButton, post, streamAction, tabs },
  { onClickDetailTab, onLaunchNativeEditor }) =>
    <MainView className="PostDetail">
      <div className="PostDetails Posts asList">
        <article className="PostList" id={`Post_${post.get('id')}`}>
          <div className="StreamContainer PostDetailStreamContainer">
            <PostContainer postId={post.get('id')} />
            {tabs && tabs.length > 0 &&
              <div className={navStyle}>
                <TabListButtons
                  activeType={activeType}
                  className="SearchTabList"
                  key={`TabListButtons_${activeType}`}
                  onTabClick={onClickDetailTab}
                  tabClasses="LabelTab SearchLabelTab"
                  tabs={tabs}
                />
                {hasRelatedPostsButton && <RelatedPostsButton />}
              </div>
            }
            {hasEditor && activeType === 'comments' && !ElloAndroidInterface.supportsNativeEditor() && <Editor post={post} isComment />}
          </div>
          {ElloAndroidInterface.supportsNativeEditor() &&
            <button onClick={() => onLaunchNativeEditor(post, true, null)}>Add comment</button>
          }
          {streamAction && tabs && tabs.length > 0 &&
            <StreamContainer
              action={streamAction}
              className="TabListStreamContainer"
              key={`TabListStreamContainer_${activeType}`}
              paginatorText="Load More"
              paginatorCentered={activeType === 'loves' || activeType === 'reposts'}
              shouldInfiniteScroll={false}
            />
          }
          <StreamContainer
            action={loadRelatedPosts(`~${post.get('token')}`, columnCount)}
            className="RelatedPostsStreamContainer"
            shouldInfiniteScroll={false}
          />
        </article>
      </div>
    </MainView>
PostDetail.propTypes = {
  activeType: PropTypes.string.isRequired,
  columnCount: PropTypes.number.isRequired,
  hasEditor: PropTypes.bool.isRequired,
  hasRelatedPostsButton: PropTypes.bool.isRequired,
  post: PropTypes.object.isRequired,
  streamAction: PropTypes.object,
  tabs: PropTypes.array.isRequired,
}
PostDetail.defaultProps = {
  streamAction: null,
}
PostDetail.contextTypes = {
  onClickDetailTab: PropTypes.func.isRequired,
  onLaunchNativeEditor: PropTypes.func.isRequired,
}

export const PostDetailError = ({ children }) =>
  <MainView className="PostDetail">
    <section className="StreamContainer isError">
      {children}
    </section>
  </MainView>
PostDetailError.propTypes = {
  children: PropTypes.node.isRequired,
}

