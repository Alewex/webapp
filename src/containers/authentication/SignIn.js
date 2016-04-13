import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { replace } from 'react-router-redux'
import { random, debounce } from 'lodash'
import { FORM_CONTROL_STATUS as STATUS, ONBOARDING_VERSION } from '../../constants/gui_types'
import { AUTHENTICATION_PROMOTIONS } from '../../constants/promotions/authentication'
import { loadProfile, saveProfile } from '../../actions/profile'
import { getUserCredentials } from '../../actions/authentication'
import { trackEvent } from '../../actions/tracking'
import Cover from '../../components/assets/Cover'
import Credits from '../../components/assets/Credits'
import EmailControl from '../../components/forms/EmailControl'
import PasswordControl from '../../components/forms/PasswordControl'
import FormButton from '../../components/forms/FormButton'
import {
  isFormValid,
  getEmailStateFromClient,
  getPasswordState,
} from '../../components/forms/Validators'
import { isAndroid } from '../../components/interface/Viewport'
import AppleStoreLink from '../../components/support/AppleStoreLink'

let _isAndroid

class SignIn extends Component {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    currentStream: PropTypes.string,
    webOnboardingVersionSeen: PropTypes.string,
  }

  componentWillMount() {
    const userlist = AUTHENTICATION_PROMOTIONS
    const index = random(0, userlist.length - 1)
    this.state = {
      showEmailError: false,
      showPasswordError: false,
      emailState: { status: STATUS.INDETERMINATE, message: '' },
      featuredUser: userlist[index],
      passwordState: { status: STATUS.INDETERMINATE, message: '' },
    }
    this.emailValue = ''
    this.passwordValue = ''

    this.delayedShowEmailError = debounce(this.delayedShowEmailError, 1000)
    this.delayedShowPasswordError = debounce(this.delayedShowPasswordError, 1000)
  }

  componentDidMount() {
    _isAndroid = isAndroid()
  }

  componentWillReceiveProps(nextProps) {
    if (typeof this.props.webOnboardingVersionSeen === 'undefined' &&
        this.props.webOnboardingVersionSeen !== nextProps.webOnboardingVersionSeen) {
      const { currentStream, dispatch } = this.props
      if (nextProps.webOnboardingVersionSeen &&
          nextProps.webOnboardingVersionSeen !== ONBOARDING_VERSION) {
        dispatch(replace({ pathname: '/onboarding' }))
        dispatch(saveProfile({ web_onboarding_version: ONBOARDING_VERSION }))
      } else if (!nextProps.webOnboardingVersionSeen) {
        dispatch(replace({ pathname: currentStream }))
        dispatch(saveProfile({ web_onboarding_version: ONBOARDING_VERSION }))
      } else {
        dispatch(replace({ pathname: currentStream }))
      }
    }
  }

  onBlurControl = () => {
    if (_isAndroid) {
      document.body.classList.remove('hideCredits')
    }
  }

  onChangeEmailControl = ({ email }) => {
    this.setState({ showEmailError: false })
    this.delayedShowEmailError()
    this.emailValue = email
    const { emailState } = this.state
    const currentStatus = emailState.status
    const newState = getEmailStateFromClient({ value: email, currentStatus })
    if (newState.status !== currentStatus) {
      this.setState({ emailState: newState })
    }
  }

  onChangePasswordControl = ({ password }) => {
    this.setState({ showPasswordError: false })
    this.delayedShowPasswordError()
    this.passwordValue = password
    const { passwordState } = this.state
    const currentStatus = passwordState.status
    const newState = getPasswordState({ value: password, currentStatus })
    if (newState.status !== currentStatus) {
      this.setState({ passwordState: newState })
    }
  }

  onFocusControl = () => {
    if (_isAndroid) {
      document.body.classList.add('hideCredits')
    }
  }

  onSubmit = async (e) => {
    e.preventDefault()

    const { dispatch } = this.props
    const action = getUserCredentials(this.emailValue, this.passwordValue)

    const success = await dispatch(action)

    if (success) {
      dispatch(loadProfile())
    } else {
      this.setState({ failureMessage: 'Your email or password were incorrect.' })
    }
  }

  onClickTrackCredits = () => {
    const { dispatch } = this.props
    dispatch(trackEvent('authentication-credits-clicked'))
  }

  delayedShowEmailError = () => {
    this.setState({ showEmailError: true })
  }

  delayedShowPasswordError = () => {
    this.setState({ showPasswordError: true })
  }

  renderStatus(state) {
    return () => {
      if (state.status === STATUS.FAILURE) {
        return <p className="HoppyStatusMessage hasContent">{state.message}</p>
      }
      return <p className="HoppyStatusMessage"><span /></p>
    }
  }

  render() {
    const {
      emailState, showEmailError,
      passwordState, showPasswordError,
      failureMessage, featuredUser,
    } = this.state
    const isValid = isFormValid([emailState, passwordState])
    return (
      <section className="Authentication Panel">
        <div className="AuthenticationFormDialog">
          <h1>
            Welcome back.
          </h1>
          <form
            className="AuthenticationForm"
            id="NewSessionForm"
            noValidate="novalidate"
            onSubmit={ this.onSubmit }
            role="form"
          >
            <EmailControl
              classList="asBoxControl"
              label="Email"
              onBlur={ this.onBlurControl }
              onChange={ this.onChangeEmailControl }
              onFocus={ this.onFocusControl }
              renderStatus={ showEmailError ? this.renderStatus(emailState) : null }
              tabIndex="1"
            />
            <PasswordControl
              classList="asBoxControl"
              label="Password"
              onBlur={ this.onBlurControl }
              onChange={ this.onChangePasswordControl }
              onFocus={ this.onFocusControl }
              renderStatus={ showPasswordError ? this.renderStatus(passwordState) : null }
              tabIndex="2"
            />
            {failureMessage ? <p>{failureMessage}</p> : null}
            <FormButton disabled={ !isValid } tabIndex="3">Log in</FormButton>
          </form>
          <Link className="ForgotPasswordLink" to="/forgot-password">Forgot password?</Link>
        </div>
        <AppleStoreLink />
        <Credits onClick={ this.onClickTrackCredits } user={ featuredUser } />
        <Cover coverImage={ featuredUser.coverImage } modifiers="asFullScreen withOverlay" />
      </section>
    )
  }
}

const mapStateToProps = state => ({
  currentStream: state.gui.currentStream,
  webOnboardingVersionSeen: state.profile.webOnboardingVersion,
})

export default connect(mapStateToProps)(SignIn)

