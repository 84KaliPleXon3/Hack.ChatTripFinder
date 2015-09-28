var http = require("http");
var fs = require("fs");

var html = fs.readFileSync("./weblist.html");
var data = [];
var stringData = false;

refresh();
setInterval(refresh, 5 * 60 * 1000);
function refresh()
{
    fs.readdir("./data", function(err, files)
    {
        if(err)
            throw err;

        data = [];

        for(var i = 0; i < files.length; i++)
        {
            if(err)
                throw err;

            (function(file)
            {
                fs.readFile("./data/" + file, function(err, content)
                {
                    try
                    {
                        var fileData = JSON.parse(content);
                        var trips = Object.keys(fileData);
                        data = data.concat(trips);
                        stringData = false;
                    }
                    catch(e)
                    {
                        console.log("failed parsing contents of file " + file + ": " + e.message);
                    }
                });
            })(files[i]);
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
