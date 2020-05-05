const Discord = require('discord.js');
const { commandPrefix, betIndicator, token } = require('./config.json');
const client = new Discord.Client();

// #region Helper F's
const getNick = (id, channel) => {
  const user = channel.members.find(u => u.user.id === id);
  return (user.nickname === undefined || user.nickname === null) ? user.user.username : user.nickname;
};

function addMember(user, currentBets, idsPlaying, channel) {
  if (currentBets[user.id] === undefined) {
    idsPlaying.push(user.id);
    currentBets[user.id] = null;

    channel.send('Added ' + getNick(user.id, channel) + ' to planning members.');
  }
}

function removeMember(user, currentBets, idsPlaying, channel) {
  if (currentBets[user.id] === null) {
    const index = idsPlaying.indexOf(user.id);
    idsPlaying.splice(index, 1);
    delete currentBets[user.id];
        
    channel.send('Removed ' + getNick(user.id, channel) + ' to planning members.');
  }
}

function listSprintMembers(idsPlaying, channel) {
  const list = idsPlaying.map((memberID) => getNick(memberID, channel));
  if (list.length > 0) {
    channel.send('Current users in the Sprint: ' + list.join(', '));
    return;
  } else {
    channel.send('No users in the Sprint.');
  }
}

function makeAuthorBet(authorID, currentBets, points, channel) {
  if (points !== null && !isNaN(points) && points >= 0) {
    const currentBet = currentBets[authorID];
    currentBets[authorID] = points;

    if (currentBet === null)
      channel.send('> ' + getNick(authorID, channel) + ' has made a bet.');
  }
}

function clearAuthorBet(authorID, currentBets, channel) {
  const currentBet = currentBets[authorID];
  if (currentBet !== null) {
    channel.send('> ' + getNick(authorID, channel) + ' has cleared his bet.');
    currentBets[authorID] = null;
  }
}

function roundUpBets(currentBets, idsPlaying, channel, arg) {
  const betIds = Object.keys(currentBets);
  if (betIds.length > 0) {
    const miss = [];
    betIds.forEach((id) => {
      if (currentBets[id] === null) miss.push(getNick(id, channel));
    });
      
    if (miss.length > 0) {
      if (arg === '-s') {
        if (miss.length === idsPlaying.length) {
          channel.send('Ending round, no bets were made.');
          return false;
        }
      } else {
        channel.send('Following users still need to bet: ' + miss.join(', '));
        return true;
      }
    }

    let total = betIds.reduce((sum, next) => sum += currentBets[next], 0);
    let avg = total / (betIds.length - miss.length);
    let rounded = Math.round(avg);

    let averageMsg = '> - \n> Average: `' + avg + '`';
    let roundedMsg = rounded !== avg ? ' ≈ `' + rounded + '`' : '';

    const betsText = betIds.sort().reduce((msg, id) => {
      const user = getNick(id, channel);
      let valMsg;
      if(currentBets[id] === null) valMsg = ' did not bet.';
      else valMsg = ' bet `' + currentBets[id] + '` points.';
      
      return msg + '> ' + user + valMsg + '\n';
    }, '');

    channel.send('*Bets are Over:*\n' + betsText + averageMsg + roundedMsg);
  } else {
    channel.send('No bets were made.');
  }
    
  betIds.forEach((memberID) => currentBets[memberID] = null);
  return false;
}
// #endregion


// #region Discord.js listener and variables.
let idsPlaying = [];
let currentBets = {};
let betting = false;
let planned = false;
let plannerID;

// Yes I want the console to tell what is going on.
client.once('ready', () => {
  console.log('Ready!');
});

client.on('message', message => {
  // Avoids parsing it's own messages.
  if (message.author.id === client.user.id) return;

  const { channel, content, mentions } = message;
  const commandType = content.substring(0, 1);
  const authorID = message.author.id;

  if (commandType === commandPrefix) {
    var args = content.substring(1).split(' ');
    var command = args[0];

    if (planned === false) {
      if (command === 'sprint') {
        const { roles } = mentions;
        if (roles.size === 0) {
          channel.send('Please mention the role that will be part of this sprint.');
          return;
        }
        
        idsPlaying = [...new Set(roles.map((role) => role.members.keyArray()).flat())];
        idsPlaying.forEach((memberID) => currentBets[memberID] = null);
        plannerID = authorID;
        planned = true;

        channel.send('Planning sprint with provided role. Use `!bet` to start betting process, `!add` to insert additional users into the sprint and `!remove` to do the opposite.');
      }
      return;
    }

    switch (command) {
      case 'add': 
        mentions.users.forEach((user) => addMember(user, currentBets, idsPlaying, channel));
        break;
          
      case 'remove':
        mentions.users.forEach((user) => removeMember(user, currentBets, idsPlaying, channel));
        break;
      
      case 'bet':
        if (betting === false) {
          channel.send('Ready to receive bets, do so by sending `#<points>` to bet and `!clear` to remove your bet.\nChannel will be kept clean from messages, use `!deal` to end round.');
          betting = true;
        } else {
          channel.send('Already listening to bets.');
        }

        break;

      case 'list':
        listSprintMembers(idsPlaying, channel);
        break;
          
      case 'deal': 
        if (betting === true) {
          betting = roundUpBets(currentBets, idsPlaying, channel, args[1]);
        }
        break;

      case 'clear':
        clearAuthorBet(authorID, currentBets, channel);
        break;

      case 'finish': 
        if (authorID !== plannerID && args[1] !== '-f') {
          channel.send('Sorry, either pass `-f` to force it or request ' + getNick(plannerID, channel) + ' to do this for you.');
          return;
        }
        
        plannerID = undefined;
        planned = false;
        
        message.channel.send('Wrapping up.\nGood week everyone! :robot:');
    }
  } else if (betting === true && planned === true) {
    if (commandType === betIndicator) {
      var points = parseInt(content.substring(1).split(' '), 10);
      makeAuthorBet(authorID, currentBets, points, channel);
    }

    message.delete();
  }
});

client.login(token);
// #endregion