// @flow
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { selectDiscoverMetaData } from 'ello-brains/selectors/categories'
import { selectPathname, selectQueryTerms, selectViewNameFromRoute } from 'ello-brains/selectors/routing'
import { META } from 'ello-brains/constants/locales/en'
import {
  selectPostMetaCanonicalUrl,
  selectPostMetaDescription,
  selectPostMetaEmbeds,
  selectPostMetaImages,
  selectPostMetaRobots,
  selectPostMetaTitle,
  selectPostMetaUrl,
} from 'ello-brains/selectors/post'
import {
  selectUserMetaDescription,
  selectUserMetaImage,
  selectUserMetaRobots,
  selectUserMetaTitle,
} from 'ello-brains/selectors/user'
import { selectPagination } from '../selectors/pagination'
import { DefaultTags, PostDetailTags } from '../components/head/TagRenderables'

const selectDefaultMetaRobots = createSelector(
  [selectViewNameFromRoute, selectQueryTerms], (viewName, terms) => {
    if (viewName === 'search' && terms && terms.length) {
      return terms.charAt(0) === '#' ? 'index, follow' : 'noindex, follow'
    }
    return null
  },
)

function mapStateToProps(state, props) {
  const pagination = selectPagination(state, props)
  const pathname = selectPathname(state)
  const viewName = selectViewNameFromRoute(state, props)

  if (viewName === 'postDetail') {
    const images = selectPostMetaImages(state, props)
    const hasImages = images.schemaImages && images.schemaImages.length
    return {
      canonicalUrl: selectPostMetaCanonicalUrl(state, props),
      card: hasImages ? 'summary_large_image' : 'summary',
      description: selectPostMetaDescription(state, props),
      embeds: selectPostMetaEmbeds(state, props),
      images,
      pathname,
      robots: selectPostMetaRobots(state, props),
      title: selectPostMetaTitle(state, props),
      url: selectPostMetaUrl(state, props),
      viewName,
    }
  }

  const baseTags = {
    description: META.DESCRIPTION,
    image: META.IMAGE,
    nextPage: pagination ? pagination.get('next') : null,
    pathname,
    robots: selectDefaultMetaRobots(state, props),
    title: META.TITLE,
    // $FlowFixMe
    url: `${ENV.AUTH_DOMAIN}${pathname}`,
    viewName,
  }

  switch (viewName) {
    case 'userDetail':
      return {
        ...baseTags,
        description: selectUserMetaDescription(state, props),
        image: selectUserMetaImage(state, props),
        robots: selectUserMetaRobots(state, props),
        title: selectUserMetaTitle(state, props),
      }
    case 'discover': {
      const discoverMetaData = selectDiscoverMetaData(state, props)
      return {
        ...baseTags,
        description: discoverMetaData.description,
        image: discoverMetaData.image,
        title: discoverMetaData.title,
      }
    }
    case 'search':
      return {
        ...baseTags,
        description: META.SEARCH_PAGE_DESCRIPTION,
        title: META.SEARCH_TITLE,
      }
    case 'authentication': {
      switch (pathname) {
        case '/enter':
          return {
            ...baseTags,
            description: META.ENTER_PAGE_DESCRIPTION,
            title: META.ENTER_TITLE,
          }
        case '/forgot-password':
          return {
            ...baseTags,
            description: META.FORGOT_PAGE_DESCRIPTION,
            title: META.FORGOT_TITLE,
          }
        case '/join':
        case '/signup':
          return {
            ...baseTags,
            description: META.SIGNUP_PAGE_DESCRIPTION,
            title: META.SIGNUP_TITLE,
          }
        default: return baseTags
      }
    }
    default: return baseTags
  }
}

type MetaProps = {
  canonicalUrl?: string | null,
  card: string,
  description: string,
  embeds: Object,
  image: string,
  images: Object,
  nextPage?: string | null,
  pathname: string,
  robots?: string | null,
  title: string,
  url: string,
  viewName: string,
}

class MetaContainer extends Component {
  props: MetaProps

  static defaultProps = {
    canonicalUrl: null,
    nextPage: null,
    robots: null,
  }

  shouldComponentUpdate(nextProps) {
    return ['pathname', 'nextPage', 'title', 'robots'].some(prop =>
      nextProps[prop] !== this.props[prop],
    )
  }

  render() {
    const {
      canonicalUrl,
      card,
      description,
      embeds,
      image,
      images,
      nextPage,
      pathname,
      robots,
      title,
      url,
      viewName,
    } = this.props

    if (viewName === 'postDetail') {
      return (
        <PostDetailTags
          {...{ canonicalUrl, card, description, embeds, images, pathname, robots, title, url }}
        />
      )
    }
    return (
      <DefaultTags
        {...{ description, image, nextPage, pathname, robots, title, url }}
      />
    )
  }
}

export default connect(mapStateToProps)(MetaContainer)

