const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const sheetrock = require('sheetrock');

const app = express();

app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
    // GET where ssl_check set to 1 from Slack
    if (req.query.ssl_check == 1) {
        return res.sendStatus(200);
    }
    return res.sendStatus(403);
});

app.get('/slack-auth', function(req, res) {
    let data = {form: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: req.query.code
    }};

    request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {

        // let bot_access_token = JSON.parse(body).bot.bot_access_token;
        // console.log('bot_access_token', bot_access_token);

        let token = JSON.parse(body).access_token; // Auth token
        console.log('token', token);

        if (!error && response.statusCode == 200) {
            res.redirect(process.env.THANK_YOU_REDIRECT);
        }
    });
});

app.post('/', function(req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }

    if (req.body.token == process.env.SLACK_AUTH_TOKEN) {

        let text = req.body.text ? req.body.text : 'excuseme';
        let channel = req.body.channel_id ? req.body.channel_id : '#general';

        console.log('channel', channel);

        sheetrock({
            // url: "https://docs.google.com/spreadsheets/d/1QO5dyK6EgIP81SGZMlHMk8xn88u_budzF2Td3OoOZzY/edit#gid=0",
            // url: `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SPREADSHEET_ID}/edit?usp=sharing`,
            url: `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SPREADSHEET_ID}/edit#gid=0`,
            query: `Select B where A = "${text}"`,
            reset: true,
            callback: function (error, options, response) {
                // console.log('>>', response.rows);
                // console.log('attributes', response.attributes.labels[0]);
                // response.rows.cellsArray[0] // nope

                let donger = response.attributes ? response.attributes.labels[0] : 'ヽ| ͡☉ ︿ ͡☉ |ノ⌒.';

                let data = {form: {
                    // "token": process.env.SLACK_BOT_TOKEN,
                    "token": process.env.SLACK_AUTH_TOKEN,
                    "username": text,
                    "channel": channel,
                    "text": donger,
                    "as_user": true,
                }};

                console.log('data', data);

                request.post('https://slack.com/api/chat.postMessage', data, function (error, response, body) {
                    let json = JSON.parse(body);
                    console.log('ok?', json.ok);

                    if (!json.ok) {
                        console.log('bad');
                        console.log('error', json.error);
                    } else {
                        console.log('good');
                        if (json.warning) {
                            console.log('BUT warning', json.warning);
                        }
                    }

                    // if (!error && response.statusCode == 200) {
                    //     console.log('allgood?');
                    // }

                    // if (error) {
                    //     console.log('error', error);
                    // }
                });
                // res.json(response);

                // var response = {
                //     "response_type": "in_channel",
                //     "text": donger,
                // }
                // res.json(response);
                res.json({"text": "working..."});
            }
        });
    }
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
