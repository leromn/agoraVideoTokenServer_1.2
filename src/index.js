const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const APP_ID = 'e2eefdac63734cd39bec7b696add7937';
const APP_CERTIFICATE = 'ad76d212a4634daeaa78bf52072cbb04';
const PORT = 9090;
let CurrentChannel = null;

const app = express();

const nocache = (_, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
};

const generateRTCToken = (req, resp) => {
  resp.header('Access-Control-Allow-Origin', '*');

  // get channelName
  const channelName = req.params.channel;
  if (!channelName) {
    return resp.status(500).json({ error: 'channel is required' });
  }

  let uid = req.params.uid;
  if (!uid || uid === '') {
    return resp.status(500).json({ error: 'uid is required' });
  }

  // get role
  let role;
  if (req.params.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else if (req.params.role === 'audience') {
    role = RtcRole.SUBSCRIBER;
  } else {
    return resp.status(500).json({ error: 'role is incorrect' });
  }

  let expireTime = req.query.expiry;
  if (!expireTime || expireTime === '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  let token;
  if (req.params.tokentype === 'userAccount') {
    token = RtcTokenBuilder.buildTokenWithAccount(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );
  } else if (req.params.tokentype === 'uid') {
    token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );
  } else {
    return resp.status(500).json({ error: 'token type is invalid' });
  }
  CurrentChannel = { cn: channelName, chtoken: token };
  return resp.json({ chToken: token });
};

app.get('/rtc/:channel/:role/:tokentype/:uid', nocache, generateRTCToken);
app.get('/currentChannel', (req, resp) => {
  if (CurrentChannel !== null) {
    return resp.json(CurrentChannel);
  } else {
    return resp.status(400).json({ error: 'no previous channel found' });
  }
});

app.listen(PORT, () => {
  console.log(`Listenin...g on port: ${PORT}`);
});
