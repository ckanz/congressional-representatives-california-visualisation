import { token } from './creds.json';

const loadingMessage = document.getElementById('loading');
let callCounter = 0;

const CONGRESS_NUMBER = 116;
const CONGRESS_TYPE = 'house';
const votes = true;

const getApiData = (url, callback) => {
  fetch(url,  { headers: {
      'X-API-Key': token
    }}).then(res => {
    res.json().then(data => {
      callCounter++;
      if (callback) {
        callback(data);
      }
    });
  });
};

const getVotingBehaviour = (memberArray, callback) => {
  const url = new URL(window.location);
  const voteParam = url.searchParams.get("votes"); // H000874 Steny Hoyer
  let voteMember;
  if (voteParam) {
    memberArray.forEach(member => {
      if(member.first_name === voteParam || member.id === voteParam) {
	voteMember = member;
      }
    });
  }
  if (!votes || !voteMember) {
    callback([]);
    return;
  }
  loadingMessage.innerHTML = `Fetching voting relations for ${voteMember.first_name} ...`;
  const links = [];
  memberArray.forEach((member, index) => {
    if (voteMember.id !== member.id) {
      const voteUrl = `https://api.propublica.org/congress/v1/members/${voteMember.id}/votes/${member.id}/${CONGRESS_NUMBER}/${CONGRESS_TYPE}.json`;
      getApiData(voteUrl, response => {
	links.push({
	  source: voteMember.id,
	  target: member.id,
	  value: response.results[0].agree_percent || 0,
	  raw: response.results[0] || {}
	});
	if (index === memberArray.length - 1) {
	  callback(links);
	}
      });
    }
  });
}

const getMembers = callback => {
  const membersHouse = `https://api.propublica.org/congress/v1/${CONGRESS_NUMBER}/${CONGRESS_TYPE}/members.json`;
  let membersArray = [];

  loadingMessage.innerHTML = `Fetching ${CONGRESS_TYPE} members of the ${CONGRESS_NUMBER} Congress ...`;
  getApiData(membersHouse, response => {
    membersArray = membersArray.concat(response.results[0].members);
    getVotingBehaviour(membersArray, votedLinks => {
      console.log('Calls made:', callCounter);
      loadingMessage.style.display = 'none';
      callback({
	nodes: membersArray,
	links: votedLinks
      });
    });
  });
};

export {
  getMembers
}
