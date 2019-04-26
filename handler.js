const path = require('path');
const http = require('http');

const PRERENDER_SOURCE_URL = 'https://dhu59qhs5qaqi.cloudfront.net'
const RENDERTRON_URL = 'http://ec2-18-208-232-135.compute-1.amazonaws.com/render'

const BOT_USER_AGENTS = [
  'Baiduspider',
  'Bingbot',
  'Embedly',
  'LinkedInBot',
  'outbrain',
  'pinterest',
  'quora link preview',
  'rogerbot',
  'showyoubot',
  'Slackbot',
  'TelegramBot',
  'Twitterbot',
  'vkShare',
  'W3C_Validator',
  'WhatsApp',
  'Googlebot',
  'Slurp',
  'DuckDuckBot',
  'YandexBot'
];

const getPrerender = (path,cb) => {
  const url = `${RENDERTRON_URL}/${encodeURIComponent(path)}`;
  console.log('rendertron service with url:',url)
  http.get(url, (res) => {
    let response;
    let body = '';
    
    response = res;

    response.on('data', (chunk) => {
      body += chunk;
    });

    response.on('end', () => {
      cb(true, body, res.headers);
    });
  }).on('error', (e) => cb(false, e));
}

const generateResponse = (body) => {
  return {
    status: '200',
    statusDescription: "OK",
    headers: {
      'cache-control': [{
          key: 'Cache-Control',
          value: 'max-age=100'
      }],
      'content-type': [{
          key: 'Content-Type',
          value: 'text/html'
      }],
      'content-encoding': [{
          key: 'Content-Encoding',
          value: 'UTF-8'
      }],
    },
    body
  };
}

const getHeader = (cloudFrontRequest, name) =>
  cloudFrontRequest.headers[name] &&
  cloudFrontRequest.headers[name][0] &&
  cloudFrontRequest.headers[name][0].value;

const ORIGNAL_USER_AGENT = 'prerender-lambda-edge-original-user-agent'

module.exports.viewerRequest = (event, context, callback) => {
  const { request } = event.Records[0].cf;

  request.headers[ORIGNAL_USER_AGENT] = [
    {
      key: ORIGNAL_USER_AGENT,
      value: getHeader(request, "user-agent")
    }
  ];
  
  return callback(null, request);
};

module.exports.originRequest = (event, context, callback) => {
  const { request } = event.Records[0].cf;

  const parsedPath = path.parse(request.uri);

  const uapattern = new RegExp(BOT_USER_AGENTS.join('|'), 'i');

  console.log('request.uri', request.uri)
  if (request.uri === '/index.html' || parsedPath.ext === '') {
    console.log('user agent', getHeader(request, ORIGNAL_USER_AGENT), 'test', uapattern.test(getHeader(request, ORIGNAL_USER_AGENT)))
    if(uapattern.test(getHeader(request, ORIGNAL_USER_AGENT))) {
      const p = request.uri === '/index.html' ? '/':request.uri
      getPrerender(`${PRERENDER_SOURCE_URL}${p}`,(status,data) => {
        if(status) {
          console.log('data', data);
          callback(null, generateResponse(data));
        } else {
          console.log('error', data);
          callback(null, request);
        }
      })
    } else {
      request.uri = parsedPath.ext === '' ? "/index.html" : request.uri;
      callback(null, request);
    }
  } else {
    callback(null, request);
  }
};

module.exports.originResponse = (event, context, callback) => {
  const cloudFrontResponse = event.Records[0].cf.response;
  callback(null, cloudFrontResponse);
};
