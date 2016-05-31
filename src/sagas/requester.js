/* eslint-disable no-constant-condition */
import React from 'react'
import { get } from 'lodash'
import { camelizeKeys } from 'humps'
import { actionChannel, call, fork, put, select, take } from 'redux-saga/effects'
import * as ACTION_TYPES from '../constants/action_types'
import { refreshAuthenticationToken } from '../actions/authentication'
import { pauseRequester, unpauseRequester } from '../actions/api'
import {
  accessTokenSelector,
  isLoggedInSelector,
  refreshTokenSelector,
} from './selectors'
import { sagaFetch } from './api'
import { openAlert } from '../actions/modals'
import Dialog from '../components/dialogs/Dialog'

const requestTypes = [
  ACTION_TYPES.AUTHENTICATION.FORGOT_PASSWORD,
  ACTION_TYPES.AUTHENTICATION.LOGOUT,
  ACTION_TYPES.AUTHENTICATION.REFRESH,
  ACTION_TYPES.AUTHENTICATION.USER,
  ACTION_TYPES.COMMENT.CREATE,
  ACTION_TYPES.COMMENT.DELETE,
  ACTION_TYPES.COMMENT.EDITABLE,
  ACTION_TYPES.COMMENT.FLAG,
  ACTION_TYPES.COMMENT.UPDATE,
  ACTION_TYPES.EDITOR.EMOJI_COMPLETER,
  ACTION_TYPES.EDITOR.LOAD_REPLY_ALL,
  ACTION_TYPES.EDITOR.POST_PREVIEW,
  ACTION_TYPES.EDITOR.USER_COMPLETER,
  ACTION_TYPES.HEAD,
  ACTION_TYPES.INVITATIONS.GET_EMAIL,
  ACTION_TYPES.INVITATIONS.INVITE,
  ACTION_TYPES.LOAD_NEXT_CONTENT,
  ACTION_TYPES.LOAD_STREAM,
  ACTION_TYPES.POST.COMMENT,
  ACTION_TYPES.POST.CREATE,
  ACTION_TYPES.POST.DELETE,
  ACTION_TYPES.POST.DETAIL,
  ACTION_TYPES.POST.EDITABLE,
  ACTION_TYPES.POST.FLAG,
  ACTION_TYPES.POST.LOVE,
  ACTION_TYPES.POST.UPDATE,
  ACTION_TYPES.POST_FORM,
  ACTION_TYPES.POST_JSON,
  ACTION_TYPES.PROFILE.AVAILABILITY,
  ACTION_TYPES.PROFILE.DELETE,
  ACTION_TYPES.PROFILE.DETAIL,
  ACTION_TYPES.PROFILE.EXPORT,
  ACTION_TYPES.PROFILE.LOAD,
  ACTION_TYPES.PROFILE.REQUEST_INVITE,
  ACTION_TYPES.PROFILE.SAVE,
  ACTION_TYPES.PROFILE.SIGNUP,
  ACTION_TYPES.RELATIONSHIPS.UPDATE,
  ACTION_TYPES.USER.FLAG,
]

let requesterIsPaused = false

const runningFetches = {}
function updateRunningFetches(serverResponse) {
  const serverResponseUrl = serverResponse.url && serverResponse.url.length
        ? serverResponse.url
        : serverResponse.headers.get('X-Request-Url')

  if (runningFetches[serverResponseUrl]) {
    delete runningFetches[serverResponseUrl]
  } else {
    Object.keys(runningFetches).forEach((key) => {
      delete runningFetches[key]
    })
  }
}

function parseLink(linksHeader) {
  if (!linksHeader) { return {} }
  const result = {}
  const entries = linksHeader.split(',')
  // compile regular expressions ahead of time for efficiency
  const relsRegExp = /\brel="?([^"]+)"?\s*;?/
  const keysRegExp = /(\b[0-9a-z\.-]+\b)/g
  const sourceRegExp = /^<(.*)>/
  for (let entry of entries) {
    entry = entry.trim()
    const rels = relsRegExp.exec(entry)
    if (rels) {
      const keys = rels[1].match(keysRegExp)
      const source = sourceRegExp.exec(entry)[1]
      for (const key of keys) {
        result[key] = source
      }
    }
  }
  return result
}

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

function getAuthToken(accessToken) {
  return {
    ...defaultHeaders,
    Authorization: `Bearer ${accessToken}`,
  }
}

function getHeaders(accessToken) {
  return getAuthToken(accessToken)
}

function getHeadHeader(accessToken, lastCheck) {
  return {
    ...getAuthToken(accessToken),
    'If-Modified-Since': lastCheck,
  }
}

export function extractJSON(serverResponse) {
  return serverResponse ? serverResponse.json() : serverResponse
}

export function* handleRequestError(error, action) {
  const { meta, payload, type } = action
  const FAILURE = `${type}_FAILURE`
  function* fireFailureAction() {
    if (meta && meta.failureAction) {
      if (typeof meta.failureAction === 'function') {
        yield call(meta.failureAction)
      } else {
        yield put(meta.failureAction)
      }
    }
  }

  if (error.response) {
    if (error.response.status === 401) {
      const isLoggedIn = yield select(isLoggedInSelector)
      const refreshToken = yield select(refreshTokenSelector)
      if (type !== ACTION_TYPES.AUTHENTICATION.LOGOUT &&
          type !== ACTION_TYPES.AUTHENTICATION.REFRESH &&
          isLoggedIn) {
        // If we just have an expired session,
        // trigger a refresh then put the request back on the queue
        yield put(refreshAuthenticationToken(refreshToken))
        yield put(action)
        return true
      }
    }

    if (error.response.status === 420) {
      yield put(openAlert(
        <Dialog
          title="Take a breath. You're doing Ello way too fast. A few more seconds. That's better."
          body="More Ello? Refresh the page to continue."
        />
      ))
      yield put({ error, meta, payload, type: FAILURE })
      return true
    }

    const contentType = error.response.headers.get('content-type')
    if (contentType && contentType.indexOf('application/json') > -1) {
      const errorJson = yield call(extractJSON, error.response)
      payload.response = camelizeKeys(errorJson)
      yield put({ error, meta, payload, type: FAILURE })
      yield call(fireFailureAction)
    }
  } else {
    yield put({ error, meta, payload, type: FAILURE })
    yield call(fireFailureAction)
  }
  return false
}


export function* fetchCredentials() {
  const accessToken = yield select(accessTokenSelector)
  if (accessToken) {
    return {
      token: {
        access_token: accessToken,
      },
    }
  }

  const tokenPath = (typeof window === 'undefined') ?
    `http://localhost:${process.env.PORT || 6660}/api/webapp-token` :
    `${document.location.protocol}//${document.location.host}/api/webapp-token`

  try {
    const serverResponse = yield call(fetch, tokenPath, { credentials: 'same-origin' })
    if (serverResponse.ok) {
      // Pass serverResponse as binding for serverResponse.json
      return yield call([serverResponse, serverResponse.json])
    }
    return serverResponse
  } catch (_err) {
    return yield call(fetchCredentials)
  }
}

const pathnameSelector = state => get(state, 'routing.location.pathname', '')
const lastNotificationCheckSelector = state => get(state, 'gui.lastNotificationCheck')

export function* performRequest(action) {
  const {
    type,
    meta,
    payload: { endpoint, method, body },
  } = action
  let { payload } = action

  const pathname = yield select(pathnameSelector)
  payload = {
    ...payload,
    pathname,
  }

  const options = {
    method: method || 'GET',
    credentials: 'include',
  }

  if (options.method !== 'GET' && options.method !== 'HEAD') {
    options.body = body || null
    if (options.body && typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body)
    }
  }

  const REQUEST = `${type}_REQUEST`
  const SUCCESS = `${type}_SUCCESS`

  const tokenJSON = yield call(fetchCredentials)
  const accessToken = get(tokenJSON, 'token.access_token')

  yield put({ type: REQUEST, payload, meta })

  function* fireSuccessAction() {
    if (meta && meta.successAction) {
      if (typeof meta.successAction === 'function') {
        yield call(meta.successAction)
      } else {
        yield put(meta.successAction)
      }
    }
  }

  switch (method) {
    case 'HEAD':
      options.headers = getHeadHeader(
        accessToken,
        yield select(lastNotificationCheckSelector)
      )
      break
    default:
      options.headers = getHeaders(accessToken)
      break
  }

  let response

  try {
    response = yield call(sagaFetch, endpoint.path, options)
  } catch (error) {
    updateRunningFetches(error.response)
    yield fork(handleRequestError, error, action)
    return false
  }

  const { json, serverResponse } = response

  updateRunningFetches(serverResponse)

  payload.serverResponse = serverResponse
  if (serverResponse.status === 200 || serverResponse.status === 201) {
    payload.response = camelizeKeys(json)

    if (endpoint.pagingPath && payload.response[meta.mappingType].id) {
      payload.pagination = get(
        payload,
        [
          'serverResponse',
          meta.mappingType,
          'links',
          endpoint.pagingPath,
          'pagination',
        ]
      )
    } else {
      const linkPagination = parseLink(serverResponse.headers.get('Link'))
      linkPagination.totalCount = parseInt(serverResponse.headers.get('X-TotalCount'), 10)
      linkPagination.totalPages = parseInt(serverResponse.headers.get('X-Total-Pages'), 10)
      linkPagination.totalPagesRemaining = parseInt(
        serverResponse.headers.get('X-Total-Pages-Remaining'), 10
      )
      payload.pagination = linkPagination
    }
  }
  yield put({ meta, payload, type: SUCCESS })
  yield call(fireSuccessAction)
  return true
}

function* waitForUnpause() {
  yield take(ACTION_TYPES.REQUESTER.UNPAUSE)
}

export function* handleRequest(requestChannel) {
  while (true) {
    const action = yield take(requestChannel)

    const { meta, payload: { endpoint } } = action

    if (runningFetches[endpoint.path]) {
      continue
    }
    if (requesterIsPaused) {
      yield call(waitForUnpause)
    }

    runningFetches[endpoint.path] = true

    if (get(meta, 'pauseRequester')) {
      yield put(pauseRequester())
      yield call(performRequest, action)
      yield put(unpauseRequester())
    } else {
      yield fork(performRequest, action)
    }
  }
}

function* pauseMechanism() {
  while (yield take(ACTION_TYPES.REQUESTER.PAUSE)) {
    requesterIsPaused = true
    yield take(ACTION_TYPES.REQUESTER.UNPAUSE)
    requesterIsPaused = false
  }
}

export default function* requester() {
  const requestChannel = yield actionChannel(requestTypes)
  yield fork(pauseMechanism)
  yield fork(handleRequest, requestChannel)
  // yield fork(requestSaga, requestChannel)
}