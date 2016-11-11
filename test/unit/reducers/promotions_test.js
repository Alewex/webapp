import { stubAuthPromotion } from '../../support/stubs'
import { promotions as reducer } from '../../../src/reducers/promotions'
import { PROMOTIONS } from '../../../src/constants/action_types'


describe('promotions reducer', () => {
  const authentication = ['archer', 'pam', 'malory'].map(username => stubAuthPromotion(username))

  context('#initialState', () => {
    it('sets up a default initialState', () => {
      expect(reducer(undefined, {})).to.have.keys(
        'authentication'
      )
    })
  })

  context('PROMOTIONS', () => {
    it('PROMOTIONS.AUTHENTICATION_SUCCESS sets the list of authentication in promotions', () => {
      const action = {
        type: PROMOTIONS.AUTHENTICATION_SUCCESS,
        payload: { response: authentication },
      }
      const result = reducer(reducer, action)
      expect(result.authentication).to.deep.equal(authentication)
    })
  })
})

