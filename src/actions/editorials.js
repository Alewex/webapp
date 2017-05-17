import { LOAD_STREAM } from '../constants/action_types'
import { EDITORIALS, POSTS } from '../constants/mapping_types'
import { editorials as editorialsApi } from '../networking/api'
import { editorials as editorialRenderable, postsAsCuratedEditorial } from '../components/streams/StreamRenderables'

export const loadEditorials = isPreview => (
  {
    type: LOAD_STREAM,
    payload: { endpoint: editorialsApi(isPreview) },
    meta: {
      mappingType: EDITORIALS,
      renderStream: {
        asList: editorialRenderable,
        asGrid: editorialRenderable,
      },
    },
  }
)

export const loadCuratedPosts = ({ endpointPath, title, resultKey }) => (
  {
    type: LOAD_STREAM,
    payload: { endpoint: { path: endpointPath } },
    meta: {
      mappingType: POSTS,
      renderProps: { title },
      renderStream: {
        asList: postsAsCuratedEditorial,
        asGrid: postsAsCuratedEditorial,
      },
      resultKey,
    },
  }
)

