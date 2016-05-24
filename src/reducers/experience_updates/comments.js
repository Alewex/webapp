/* eslint-disable no-param-reassign */
import _ from 'lodash'
import * as ACTION_TYPES from '../../constants/action_types'
import * as MAPPING_TYPES from '../../constants/mapping_types'
import * as jsonReducer from '../../reducers/json'

const methods = {}

methods.updateCommentsCount = (newState, postId, delta) => {
  const commentCount = newState[MAPPING_TYPES.POSTS][postId].commentsCount
  jsonReducer.methods.mergeModel(
    newState,
    MAPPING_TYPES.POSTS,
    {
      id: postId,
      commentsCount: Number(commentCount) + delta,
    }
  )
  return newState
}

methods.addOrUpdateComment = (newState, action) => {
  const { model, postId, response } = action.payload
  const post = newState[MAPPING_TYPES.POSTS][postId]
  // this is to allow for the old way the API sent the response
  // which was just as an object and not in the JSONAPI format
  const normalizedResponse = response.id ? response : response[MAPPING_TYPES.COMMENTS]
  let index = null
  switch (action.type) {
    case ACTION_TYPES.COMMENT.CREATE_SUCCESS:
    case ACTION_TYPES.COMMENT.UPDATE_SUCCESS:
      _.setWith(newState,
                [MAPPING_TYPES.COMMENTS, normalizedResponse.id],
                normalizedResponse,
                Object)
      if (action.type === ACTION_TYPES.COMMENT.UPDATE_SUCCESS) { return newState }
      // add the comment to the linked array
      if (post.links && post.links.comments) {
        post.links.comments.ids.unshift(`${normalizedResponse.id}`)
      }
      jsonReducer.methods.appendPageId(
        newState, `/posts/${postId}/comments`,
        MAPPING_TYPES.COMMENTS, normalizedResponse.id)
      return methods.updateCommentsCount(newState, postId, 1)
    case ACTION_TYPES.COMMENT.DELETE_SUCCESS:
      // add the comment to the linked array
      if (post.links && post.links.comments) {
        index = post.links.comments.ids.indexOf(`${model.id}`)
        if (index > -1) {
          post.links.comments.ids.splice(index, 1)
        }
      }
      jsonReducer.methods.removePageId(newState, `/posts/${postId}/comments`, model.id)
      return methods.updateCommentsCount(newState, postId, -1)
    case ACTION_TYPES.COMMENT.CREATE_FAILURE:
      return methods.updateCommentsCount(newState, postId, -1)
    default:
      return newState
  }
}

methods.toggleEditing = (newState, action) => {
  const { model, isEditing } = action.payload
  newState[MAPPING_TYPES.COMMENTS][model.id].isEditing = isEditing
  return newState
}

export default methods

