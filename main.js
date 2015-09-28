var fs = require("fs");
var WebSocket = require("ws");
var SocksProxyAgent = require("socks-proxy-agent");
var TorRelay = require("tor-relay");

var config = require("./config.json");

var incidents = {};

for(var i = 0; i < config.ports.length; i++)
{
    (function(port)
    {
        var instance = new TorRelay({controlPassword: false, socksPort: port});
        incidents[port] = 0;
        instance.torPort = port;
        instance.on("notice", function(event)
        {
            if(config.logTorNotices)
                console.log("[" + port + "] tor warning: " + event.message)
        });
        instance.on("warn", function(event)
        {
            if(config.logTorWarnings)
            console.log("[" + port + "] tor warning: " + event.message);
        });
        instance.start(function(err)
        {
            if(err)
                return console.log("error starting tor instance on port " + port);

            findTrip(port);
            console.log("tor ready on port " + port +" starting...");
        });
    })(config.ports[i]);
}

function findTrip(port)
{
    var looped = false;
    function next()
    {
        if(looped)
            return;
        looped = true;

        setTimeout(function()
        {
            findTrip(port);
        }, config.waitTime);
    }

    var agent = new SocksProxyAgent("socks://127.0.0.1:" + port);
    var ws = new WebSocket(config.url, {agent: agent});

    var password = Math.random().toString(36).substr(2, 10);
    var displayNick = config.nick + "_" + port + "_" + Math.random().toString(36).substr(2, 4);
    var nick = displayNick + "#" + password;

    ws.on("open", function()
    {
        ws.send(JSON.stringify({cmd: "join", nick: nick, channel: config.channel}));
        ws.send(JSON.stringify({cmd: "chat", text: "."}));
    });
    ws.on("error", function(err)
    {
        try
        {
            ws.terminate();
        }
        catch(e)
        { }

        if(config.logErrors)
            console.log("error with port " + port + ": " + err);

        incidents[port]++;
        if(incidents[port] > 2)
        {
            if(config.logErrors)
                console.log("[" + port + "] restarting tor...");
            tor.restart(function(err)
            {
                if(err)
                    throw err;

                next();
            });
        }
        else
        {
            next();
        }
    });
    ws.on("message", function(data)
    {
        data = JSON.parse(data);

        if(typeof data.cmd != "string")
            return;

        if(data.cmd == "chat" && data.nick == displayNick)
        {
            ws.close();

            var time = (new Date().getTime() - startTime) / 1000;
            var line = data.trip + "-" + password + "-" + (new Date().getTime()) + "\n";
            fs.appendFile("trips.txt", line, function(err)
            {
                if(err && config.logErrors)
                    console.log("error saving trip " + line + "\n" + err);
                incidents[port]--;
                next();
            });
        }
        else if(data.cmd == "warn")
        {
            ws.close();
            next();
        }
    });
}
