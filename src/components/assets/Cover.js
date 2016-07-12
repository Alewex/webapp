import React, { Component, PropTypes } from 'react'
import { isEqual } from 'lodash'
import classNames from 'classnames'
import ImageAsset from '../assets/ImageAsset'

const STATUS = {
  PENDING: 'isPending',
  REQUEST: 'isRequesting',
  SUCCESS: null,
  FAILURE: 'isFailing',
}

export default class Cover extends Component {

  static propTypes = {
    coverDPI: PropTypes.string,
    coverImage: PropTypes.object,
    coverOffset: PropTypes.number,
    isHidden: PropTypes.bool,
    isModifiable: PropTypes.bool,
    modifiers: PropTypes.string,
    useGif: PropTypes.bool,
  }

  static defaultProps = {
    coverDPI: 'xhdpi',
    isHidden: false,
    modifiers: '',
    useGif: false,
  }

  componentWillMount() {
    this.state = {
      status: STATUS.REQUEST,
    }
  }

  componentWillReceiveProps(nextProps) {
    const thisSource = this.getCoverSource()
    const nextSource = this.getCoverSource(nextProps)
    if (thisSource !== nextSource) {
      this.setState({
        status: nextSource ? STATUS.REQUEST : STATUS.PENDING,
      })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const thisCompare = { ...this.props, ...this.state }
    const nextCompare = { ...nextProps, ...nextState }
    return !isEqual(thisCompare, nextCompare)
  }

  onLoadSuccess = () => {
    this.setState({ status: STATUS.SUCCESS })
  }

  onLoadFailure = () => {
    this.setState({ status: STATUS.FAILURE })
  }

  getClassNames() {
    const { isHidden, isModifiable, modifiers } = this.props
    const { status } = this.state
    return classNames(
      'Cover',
      status,
      modifiers,
      { isHidden },
      { isModifiable },
    )
  }

  getCoverSource(props = this.props) {
    const { coverDPI, coverImage, useGif } = props
    if (!coverImage) {
      return ''
    } else if (coverImage.tmp && coverImage.tmp.url) {
      return coverImage.tmp.url
    }
    if (useGif && this.isGif()) {
      return coverImage.original.url
    }
    return coverImage[coverDPI] ? coverImage[coverDPI].url : null
  }

  isGif() {
    return /gif$/.test(this.props.coverImage.original.url)
  }

  render() {
    return (
      <div className={this.getClassNames()}>
        <ImageAsset
          className="CoverImage"
          isBackgroundImage
          onLoadFailure={this.onLoadFailure}
          onLoadSuccess={this.onLoadSuccess}
          src={this.getCoverSource()}
        />
      </div>
    )
  }
}

