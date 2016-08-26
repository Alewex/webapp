import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { debounce, isEqual } from 'lodash'
import { hideSoftKeyboard } from '../../vendor/jello'
import {
  selectExternalLinksList, selectName, selectShortBio, selectUsername,
} from '../../selectors/profile'
import { FORM_CONTROL_STATUS as STATUS } from '../../constants/status_types'
import { saveProfile } from '../../actions/profile'
import BioControl from '../forms/BioControl'
import NameControl from '../forms/NameControl'
import LinksControl from '../forms/LinksControl'

function mapStateToProps(state) {
  const externalLinksList = selectExternalLinksList(state)
  const name = selectName(state)
  const shortBio = selectShortBio(state)
  const username = selectUsername(state)
  return {
    externalLinksList,
    name,
    shortBio,
    username,
  }
}

class InfoForm extends Component {

  static propTypes = {
    className: PropTypes.string,
    controlClassModifiers: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    externalLinksList: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    name: PropTypes.string,
    shortBio: PropTypes.string,
    tabIndexStart: PropTypes.number,
    username: PropTypes.string,
  }

  static defaultProps = {
    tabIndexStart: 0,
  }

  componentWillMount() {
    this.state = {
      bioStatus: STATUS.INDETERMINATE,
      linksStatus: STATUS.INDETERMINATE,
      nameStatus: STATUS.INDETERMINATE,
      showThenHideMessage: false,
    }
    this.saveForm = debounce(this.saveForm, 300, { leading: true })
    this.componentWillReceiveProps(this.props)
  }

  componentWillReceiveProps(nextProps) {
    const { externalLinksList, name, shortBio } = nextProps
    const links = externalLinksList
    this.setState({
      bioStatus: shortBio && shortBio.length ? STATUS.SUCCESS : STATUS.INDETERMINATE,
      linksStatus: links && links.length ? STATUS.SUCCESS : STATUS.INDETERMINATE,
      nameStatus: name && name.length ? STATUS.SUCCESS : STATUS.INDETERMINATE,
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(nextProps, this.props) || !isEqual(nextState, this.state)
  }

  onChangeControl = (vo, prop) => {
    const status = this.state[prop]
    const hasValue = !!(Object.values(vo)[0].length)
    if (status !== STATUS.INDETERMINATE && !hasValue) {
      this.setState({ [prop]: STATUS.INDETERMINATE })
    } else if (status !== STATUS.REQUEST) {
      this.setState({ [prop]: STATUS.REQUEST })
    }
    this.saveForm(vo)
  }

  onChangeNameControl = (vo) => {
    this.onChangeControl(vo, 'nameStatus')
  }

  onChangeBioControl = (vo) => {
    this.onChangeControl(vo, 'bioStatus')
  }

  onChangeLinksControl = (vo) => {
    this.onChangeControl(vo, 'linksStatus')
  }

  onSubmit(e) {
    e.preventDefault()
    hideSoftKeyboard()
  }

  saveForm(vo) {
    this.props.dispatch(saveProfile(vo))
  }

  render() {
    const { bioStatus, linksStatus, nameStatus } = this.state
    const {
      className, controlClassModifiers, externalLinksList, name, shortBio, tabIndexStart, username,
    } = this.props
    if (!username) {
      return null
    }
    return (
      <form
        className={classNames(className, 'InfoForm')}
        noValidate="novalidate"
        onSubmit={this.onSubmit}
        role="form"
      >
        <NameControl
          classList={controlClassModifiers}
          onChange={this.onChangeNameControl}
          status={nameStatus}
          tabIndex={`${tabIndexStart}`}
          text={name || ''}
        />
        <BioControl
          classList={controlClassModifiers}
          onChange={this.onChangeBioControl}
          status={bioStatus}
          tabIndex={`${tabIndexStart + 1}`}
          text={shortBio || ''}
        />
        <LinksControl
          classList={controlClassModifiers}
          onChange={this.onChangeLinksControl}
          status={linksStatus}
          tabIndex={`${tabIndexStart + 2}`}
          text={externalLinksList}
        />
      </form>
    )
  }
}

export default connect(mapStateToProps)(InfoForm)

