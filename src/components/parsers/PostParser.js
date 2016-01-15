import React from 'react'
import { Link } from 'react-router'
import * as MAPPING_TYPES from '../../constants/mapping_types'
import { getLinkObject } from '../base/json_helper'
import { body, regionItems, setModels } from './RegionParser'
import Avatar from '../assets/Avatar'
import PostTools from '../posts/PostTools'
import { RepostIcon } from '../posts/PostIcons'
import RelationsGroup from '../relationships/RelationsGroup'

function getPostDetailPath(author, post) {
  return `/${author.username}/post/${post.token}`
}

function header(post, author) {
  if (!post || !author) { return null }
  return (
    <header className="PostHeader" key={`PostHeader_${post.id}`}>
      <div className="PostHeaderAuthor">
        <Link className="PostHeaderLink" to={`/${author.username}`}>
          <Avatar sources={author.avatar} />
          <span>{`@${author.username}`}</span>
        </Link>
      </div>
      <RelationsGroup user={author} />
    </header>
  )
}

function repostHeader(post, repostAuthor, repostSource, repostedBy) {
  if (!post || !repostedBy) { return null }
  return (
    <header className="RepostHeader" key={`RepostHeader_${post.id}`}>
      <div className="RepostHeaderAuthor">
        <Link className="PostHeaderLink" to={`/${repostAuthor.username}`}>
          <Avatar sources={repostAuthor.avatar} />
          <span>{`@${repostAuthor.username}`}</span>
        </Link>
      </div>
      <div className="RepostHeaderReposter">
        <Link className="PostHeaderLink" to={`/${repostedBy.username}`}>
          <RepostIcon />
          {` by @${repostedBy.username}`}
        </Link>
      </div>
      <RelationsGroup user={repostAuthor} />
    </header>
  )
}

function footer(post, author, currentUser) {
  if (!author) { return null }
  return (
    <PostTools
      author={author}
      post={post}
      currentUser={currentUser}
      key={`PostTools_${post.id}`}
    />
  )
}

export function parsePost(post, json, currentUser, isGridLayout = true) {
  if (!post) { return null }
  setModels(json)
  const author = json[MAPPING_TYPES.USERS][post.authorId]
  const cells = []
  const postDetailPath = getPostDetailPath(author, post)

  if (post.repostContent && post.repostContent.length) {
    const authorLinkObject = getLinkObject(post, 'repostAuthor', json)
    const sourceLinkObject = getLinkObject(post, 'repostedSource', json)
    cells.push(repostHeader(post, authorLinkObject, sourceLinkObject, author))
    // this is weird, but the post summary is
    // actually the repost summary on reposts
    if (isGridLayout) {
      cells.push(body(post.summary, post.id, isGridLayout, postDetailPath))
    } else {
      cells.push(body(post.repostContent, `repost_${post.id}`, isGridLayout, postDetailPath))
      if (post.content && post.content.length) {
        cells.push(body(post.content, post.id, isGridLayout, postDetailPath))
      }
    }
  } else {
    cells.push(header(post, author))
    const content = isGridLayout ? post.summary : post.content
    cells.push(body(content, post.id, isGridLayout, postDetailPath))
  }
  cells.push(footer(post, author, currentUser))
  setModels({})
  return cells
}

export function parseSummary(post, json, only = null) {
  setModels(json)
  return regionItems(post.summary, only, false)
}

