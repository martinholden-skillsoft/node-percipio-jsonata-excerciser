const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const logger = require('morgan');
const errorHandler = require('errorhandler');

const defaultInput = JSON.parse(fs.readFileSync('public/exampledata/metadata.json', 'utf8'));
const defaultExpression = fs.readFileSync('public/exampletransform/sfMetadata.jsonata', 'utf8');

// all environments
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(methodOverride());
app.use('/codemirror', express.static(`${__dirname}/node_modules/codemirror/`));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if (app.get('env') === 'development') {
  app.use(errorHandler());
}

app.get('/', (req, res) => {
  const inserts = {};
  inserts.input = JSON.stringify(defaultInput, null, 2);
  inserts.jsonata = defaultExpression;

  res.render('index.html', inserts);
});

module.exports = app;
