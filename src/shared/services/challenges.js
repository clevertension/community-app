/**
 * This module provides a service for convenient manipulation with Topcoder
 * challenges via TC API.
 */

import _ from 'lodash';
import qs from 'qs';
import { COMPETITION_TRACKS } from 'utils/tc';
import { getApiV2, getApiV3 } from './api';

export const ORDER_BY = {
  SUBMISSION_END_DATE: 'submissionEndDate',
};

/**
 * Normalizes a regular challenge object received from the backend.
 * NOTE: This function is copied from the existing code in the challenge listing
 * component. It is possible, that this normalization is not necessary after we
 * have moved to Topcoder API v3, but it is kept for now to minimize a risk of
 * breaking anything.
 * @param {Object} challenge Challenge object received from the backend.
 * @param {String} username Optional.
 * @return {Object} Normalized challenge.
 */
export function normalizeChallenge(challenge, username) {
  const registrationOpen = challenge.allPhases.filter(d =>
    d.phaseType === 'Registration',
  )[0].phaseStatus === 'Open' ? 'Yes' : 'No';
  const groups = {};
  if (challenge.groupIds) {
    challenge.groupIds.forEach((id) => {
      groups[id] = true;
    });
  }
  _.defaults(challenge, {
    communities: new Set([COMPETITION_TRACKS[challenge.track]]),
    groups,
    platforms: '',
    registrationOpen,
    technologies: '',
    submissionEndTimestamp: challenge.submissionEndDate,
    users: username ? { username: true } : {},
  });
}

/**
 * Normalizes a marathon match challenge object received from the backend.
 * NOTE: This function is copied from the existing code in the challenge listing
 * component. It is possible, that this normalization is not necessary after we
 * have moved to Topcoder API v3, but it is kept for now to minimize a risk of
 * breaking anything.
 * @param {Object} challenge MM challenge object received from the backend.
 * @param {String} username Optional.
 * @return {Object} Normalized challenge.
 */
export function normalizeMarathonMatch(challenge, username) {
  const endTimestamp = new Date(challenge.endDate).getTime();
  const allphases = [{
    challengeId: challenge.id,
    phaseType: 'Registration',
    phaseStatus: endTimestamp > Date.now() ? 'Open' : 'Close',
    scheduledEndTime: challenge.endDate,
  }];
  const groups = {};
  if (challenge.groupIds) {
    challenge.groupIds.forEach((id) => {
      groups[id] = true;
    });
  }
  _.defaults(challenge, {
    challengeCommunity: 'Data',
    challengeType: 'Marathon',
    allPhases: allphases,
    currentPhases: allphases.filter(phase => phase.phaseStatus === 'Open'),
    communities: new Set([COMPETITION_TRACKS.DATA_SCIENCE]),
    currentPhaseName: endTimestamp > Date.now() ? 'Registration' : '',
    groups,
    numRegistrants: challenge.numRegistrants ? challenge.numRegistrants[0] : 0,
    numSubmissions: challenge.userIds ? challenge.userIds.length : 0,
    platforms: '',
    prizes: [0],
    registrationOpen: endTimestamp > Date.now() ? 'Yes' : 'No',
    registrationStartDate: challenge.startDate,
    submissionEndDate: challenge.endDate,
    submissionEndTimestamp: endTimestamp,
    technologies: '',
    totalPrize: 0,
    track: 'DATA_SCIENCE',
    status: endTimestamp > Date.now() ? 'ACTIVE' : 'COMPLETED',
    subTrack: 'MARATHON_MATCH',
    users: username ? { username: true } : {},
  });
}

class ChallengesService {

  /**
   * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
   */
  constructor(tokenV3) {
    /**
     * Private function being re-used in all methods related to getting
     * challenges. It handles query-related arguments in the uniform way:
     * @param {String} endpoint API V3 endpoint, where the request will be send.
     * @param {Object} filters Optional. A map of filters to pass as `filter`
     *  query parameter (this function takes care to stringify it properly).
     * @param {Object} params Optional. A map of any other parameters beside
     *  `filter`.
     */
    const getChallenges = (
      endpoint,
      filters = {},
      params = {},
    ) => {
      const query = {
        filter: qs.stringify(filters),
        ...params,
      };
      return this.private.api.get(`${endpoint}?${qs.stringify(query)}`)
      .then(res => (res.ok ? res.json() : new Error(res.statusText)))
      .then(res => (
        res.result.status === 200 ? {
          challenges: res.result.content || [],
          totalCount: res.result.metadata.totalCount,
        } : new Error(res.result.content)
      ));
    };

    this.private = {
      api: getApiV3(tokenV3),
      apiV2: getApiV2(),
      getChallenges,
      tokenV3,
    };
  }

  /**
   * Gets possible challenge subtracks.
   * @return {Promise} Resolves to the array of subtrack names.
   */
  getChallengeSubtracks() {
    return Promise.all([
      this.private.apiV2.get('/design/challengetypes')
      .then(res => (res.ok ? res.json() : new Error(res.statusText))),
      this.private.apiV2.get('/develop/challengetypes')
      .then(res => (res.ok ? res.json() : new Error(res.statusText))),
    ]).then(([a, b]) => a.concat(b));
  }

  /**
   * Gets possible challenge tags (technologies).
   * @return {Promise} Resolves to the array of tag strings.
   */
  getChallengeTags() {
    return this.private.api.get('/technologies')
    .then(res => (res.ok ? res.json() : new Error(res.statusText)))
    .then(res => (
      res.result.status === 200 ?
      res.result.content :
      new Error(res.result.content)
    ));
  }

  /**
   * Gets challenges.
   * @param {Object} filters Optional.
   * @param {Object} params Optional.
   * @return {Promise} Resolves to the api response.
   */
  getChallenges(filters, params) {
    return this.private.getChallenges('/challenges/', filters, params)
    .then((res) => {
      res.challenges.forEach(item => normalizeChallenge(item));
      return res;
    });
  }

  /**
   * Gets marathon matches.
   * @param {Object} filters Optional.
   * @param {Object} params Optional.
   * @return {Promise} Resolve to the api response.
   */
  getMarathonMatches(filters, params) {
    return this.private.getChallenges('/marathonMatches/', filters, params)
    .then((res) => {
      res.challenges.forEach(item => normalizeMarathonMatch(item));
      return res;
    });
  }

  /**
   * Gets challenges of the specified user.
   * @param {String} username User whose challenges we want to fetch.
   * @param {Object} filters Optional.
   * @param {Number} params Optional.
   * @return {Promise} Resolves to the api response.
   */
  getUserChallenges(username, filters, params) {
    const endpoint = `/members/${username.toLowerCase()}/challenges/`;
    return this.private.getChallenges(endpoint, filters, params)
    .then((res) => {
      res.challenges.forEach(item => normalizeChallenge(item, username));
      return res;
    });
  }

  /**
   * Gets marathon matches of the specified user.
   * @param {String} username User whose challenges we want to fetch.
   * @param {Object} filters Optional.
   * @param {Number} params Optional.
   * @return {Promise} Resolves to the api response.
   */
  getUserMarathonMatches(username, filters, params) {
    const endpoint = `/members/${username.toLowerCase()}/mms/`;
    return this.private.getChallenges(endpoint, filters, params)
    .then((res) => {
      res.challenges.forEach(item => normalizeMarathonMatch(item, username));
      return res;
    });
  }
}

/**
 * Returns a new or existing challenges service.
 * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
 * @return {Challenges} Challenges service object
 */
let lastInstance = null;
export function getService(tokenV3) {
  if (!lastInstance || lastInstance.tokenV3 !== tokenV3) {
    lastInstance = new ChallengesService(tokenV3);
  }
  return lastInstance;
}

/* Using default export would be confusing in this case. */
export default undefined;
