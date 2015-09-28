var http = require("http");
var fs = require("fs");

var html = fs.readFileSync("./weblist.html");
var data = [];
var stringData = false;

refresh();
setInterval(refresh, 5 * 60 * 1000);
function refresh()
{
    fs.readFile("./trips.txt", function(err, content)
    {
        data = [];
        stringData = false;
        var trips = content.toString().split("\n");
        for(var i = 0; i < trips.length; i++)
        {
            var trip = trips[i].split(" ");
            data.push(trip[0]);
        }
    });
}

http.createServer(function(req, res)
{
    if(!stringData)
        stringData = JSON.stringify(data);

    if(req.url == "/")
        res.end(html);
    else if(req.url == "/data")
        res.end(stringData);
    else
        res.end("foo u theres nuthin here");
}).listen(1447);
