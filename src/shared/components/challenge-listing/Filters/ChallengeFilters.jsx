/**
 * Challenge search & filters panel.
 */

import _ from 'lodash';
import React from 'react';
import PT from 'prop-types';
import SwitchWithLabel from 'components/SwitchWithLabel';
import * as Filter from 'utils/challenge-listing/filter';
import { COMPETITION_TRACKS as TRACKS } from 'utils/tc';

import ChallengeSearchBar from './ChallengeSearchBar';
import EditTrackPanel from './EditTrackPanel';
import FiltersIcon from './FiltersSwitch/filters-icon.svg';
import FiltersPanel from './FiltersPanel';
import FiltersSwitch from './FiltersSwitch';
import FiltersCardsType from './FiltersCardsType';

import './ChallengeFilters.scss';

export default function ChallengeFilters({
  groupId,
  communityFilters,
  communityName,
  expanded,
  filterState,
  isCardTypeSet,
  saveFilter,
  searchText,
  selectCommunity,
  selectedCommunityId,
  setCardType,
  setExpanded,
  setFilterState,
  setSearchText,
  showTrackModal,
  trackModalShown,
  validKeywords,
  validSubtracks,
}) {
  let filterRulesCount = 0;
  if (filterState.tags) filterRulesCount += 1;
  if (filterState.subtracks) filterRulesCount += 1;
  if (filterState.endDate || filterState.startDate) filterRulesCount += 1;

  const isTrackOn = track =>
    !filterState.tracks || Boolean(filterState.tracks[track]);

  const switchTrack = (track, on) => {
    const act = on ? Filter.addTrack : Filter.removeTrack;
    setFilterState(act(filterState, track));
  };

  return (
    <div styleName="challenge-filters">
      <div styleName="filter-header">
        <FiltersCardsType
          isCardTypeSet={isCardTypeSet}
          setCardType={setCardType}
        />
        <ChallengeSearchBar
          onSearch={text => setFilterState(Filter.setText(filterState, text))}
          placeholder="Search Challenges"
          query={searchText}
          setQuery={setSearchText}
        />
        {
          isCardTypeSet === 'Challenges' ?
          (
            <span>
              <span styleName="filter-switch-with-label">
                <SwitchWithLabel
                  enabled={isTrackOn(TRACKS.DESIGN)}
                  labelBefore="Design"
                  onSwitch={on => switchTrack(TRACKS.DESIGN, on)}
                />
              </span>
              <span styleName="filter-switch-with-label">
                <SwitchWithLabel
                  enabled={isTrackOn(TRACKS.DEVELOP)}
                  labelBefore="Development"
                  onSwitch={on => switchTrack(TRACKS.DEVELOP, on)}
                />
              </span>
              <span styleName="filter-switch-with-label">
                <SwitchWithLabel
                  enabled={isTrackOn(TRACKS.DATA_SCIENCE)}
                  labelBefore="Data Science"
                  onSwitch={on => switchTrack(TRACKS.DATA_SCIENCE, on)}
                />
              </span>
            </span>
          ) : ''
        }
        <span styleName="pulled-right">
          {
            isCardTypeSet === 'Challenges' ?
            (
              <span
                onClick={() => showTrackModal(true)}
                role="button"
                styleName="track-btn"
                tabIndex={0}
              >
                Tracks
                <span styleName="down-arrow" />
              </span>
            ) : ''
          }
          {/* TODO: Two components below are filter switch buttons for
            * mobile and desktop views. Should be refactored to use the
            * same component, which automatically changes its style depending
            * on the viewport size. */}
          <span
            onClick={() => setExpanded(!expanded)}
            role="button"
            styleName="filter-btn"
            tabIndex={0}
          >
            <FiltersIcon styleName="FiltersIcon" />
            Filter
          </span>
          <FiltersSwitch
            active={expanded}
            filtersCount={filterRulesCount}
            onSwitch={setExpanded}
            styleName="FiltersSwitch"
          />
        </span>
      </div>

      <FiltersPanel
        groupId={groupId}
        communityFilters={communityFilters}
        communityName={communityName}
        hidden={!expanded}
        filterState={filterState}
        onClose={() => setExpanded(false)}
        onSaveFilter={saveFilter}
        selectCommunity={selectCommunity}
        selectedCommunityId={selectedCommunityId}
        setFilterState={setFilterState}
        setSearchText={setSearchText}
        validKeywords={validKeywords}
        validSubtracks={validSubtracks}
      />

      <EditTrackPanel
        opened={trackModalShown}
        onClose={() => showTrackModal(false)}
        designEnabled={isTrackOn(TRACKS.DESIGN)}
        switchDesign={on => switchTrack(TRACKS.DESIGN, on)}
        devEnabled={isTrackOn(TRACKS.DEVELOP)}
        switchDev={on => switchTrack(TRACKS.DEVELOP, on)}
        dataScienceEnabled={isTrackOn(TRACKS.DATA_SCIENCE)}
        switchDataScience={on => switchTrack(TRACKS.DATA_SCIENCE, on)}
      />
    </div>
  );
}

ChallengeFilters.defaultProps = {
  communityName: null,
  isCardTypeSet: '',
  setCardType: _.noop,
};

ChallengeFilters.propTypes = {
  groupId: PT.string.isRequired,
  communityFilters: PT.arrayOf(PT.shape()).isRequired,
  communityName: PT.string,
  expanded: PT.bool.isRequired,
  filterState: PT.shape().isRequired,
  isCardTypeSet: PT.string,
  saveFilter: PT.func.isRequired,
  selectCommunity: PT.func.isRequired,
  selectedCommunityId: PT.string.isRequired,
  setCardType: PT.func,
  setExpanded: PT.func.isRequired,
  setFilterState: PT.func.isRequired,
  searchText: PT.string.isRequired,
  setSearchText: PT.func.isRequired,
  showTrackModal: PT.func.isRequired,
  trackModalShown: PT.bool.isRequired,
  validKeywords: PT.arrayOf(PT.string).isRequired,
  validSubtracks: PT.arrayOf(PT.string).isRequired,
};
