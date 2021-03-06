var express = require('express')
    , morgan = require('morgan')
    , bodyParser = require('body-parser')
    , methodOverride = require('method-override')
    , app = express()
    , port = process.env.PORT || 3000
    , jsdom = require("jsdom")
    , async = require("async")
    , router = express.Router();

app.use(express.static(__dirname + '/views')); // set the static files location for the static html
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                     // log every request to the console
app.use(bodyParser());                      // pull information from html in POST
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(methodOverride());                  // simulate DELETE and PUT

router.get('/', function(req, res, next) {
    res.render('index.html');
});

router.post('/pdflinks', function(req, res, next) { 
    var urls = req.body.urls.split(',');
    var selector = req.body.selector;
    var PdfLinkCollection = []; 
    var errors = [];
    async.each(urls, function(url, callback) {
        jsdom.env(
            url.trim(),
            ["http://code.jquery.com/jquery.js"],
            function (err, window) {
                if(!err) {
                    if(selector && selector.trim()) {
                        try{
                            var result = eval(selector.trim());
                            if(result) {
                                PdfLinkCollection.push(window.location.origin + result);
                            }
                        } catch(e) {
                            errors.push('Failed to evaluate the expression. Please use jquery selectors only');
                        }
                    } else {
                        var pdfUppercase = window.$('a[href*=".PDF"]'),
                        pdfLowercase = window.$('a[href*=".pdf"]');
                        if(pdfUppercase) {
                            pdfUppercase.each(function (index, elem) {
                                PdfLinkCollection.push(window.location.origin + window.$(elem).attr('href'));
                            });
                        }
                        if(pdfLowercase) {;
                            pdfLowercase.each(function (index, elem) {
                                PdfLinkCollection.push(window.location.origin + window.$(elem).attr('href'));
                            });
                        }
                    }
                } else {
                    errors.push(err);
                }
                callback(err);
            }
        );
    }, function(err) {
        if(!err) {
            res.send({
                PDF: PdfLinkCollection,
                Error: errors
            });
        } else {
            res.send(500, errors);
        }
    });
    
});

app.use('/', router);

app.listen(port);
console.log('App running on port', port);