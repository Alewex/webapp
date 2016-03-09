import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'
import PostParser from '../parsers/PostParser'

const DumbGridPost = (props) => {
  const { post } = props
  return (
    <article className="PostGrid" id={ `Post_${post.id}` }>
      <PostParser
        isGridLayout
        post={post}
      />
    </article>
  )
}

DumbGridPost.propTypes = {
  isEditing: PropTypes.bool,
  isReposting: PropTypes.bool,
  post: PropTypes.object.isRequired,
  showComments: PropTypes.bool,
}

function mapGridStateToProps(state, ownProps) {
  const post = state.json.posts[ownProps.post.id]
  return {
    currentUser: state.profile,
    isEditing: post.isEditing,
    isReposting: post.isReposting,
    showComments: post.showComments,
  }
}

const GridPost = connect(mapGridStateToProps)(DumbGridPost)

class PostsAsGrid extends Component {

  static propTypes = {
    currentUser: PropTypes.object,
    gridColumnCount: PropTypes.number,
    json: PropTypes.object,
    posts: PropTypes.array.isRequired,
  };

  shouldComponentUpdate(prevProps) {
    if (_.isEqual(prevProps, this.props)) {
      return false
    }
    return true
  }

  renderColumn(posts, index) {
    return (
      <div className="Column" key={ `column_${index}` }>
        {posts.map((post) =>
           <GridPost
             key={ `gridPost_${post.id}` }
             post={ post }
           />
        )}
      </div>
    )
  }

  render() {
    const { posts, gridColumnCount } = this.props
    if (!gridColumnCount) { return null }
    const columns = []
    for (let i = 0; i < gridColumnCount; i++) {
      columns.push([])
    }
    for (const index in posts) {
      if (posts[index]) {
        columns[index % gridColumnCount].push(posts[index])
      }
    }
    return (
      <div className="Posts asGrid">
        {columns.map((columnPosts, index) => this.renderColumn(columnPosts, index))}
      </div>
    )
  }
}

export default PostsAsGrid

