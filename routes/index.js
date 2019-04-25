/**
 * © Copyright IBM Corp. 2016, 2017 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 */

/*
 * GET home page.
 */

const index = (req, res) => {
  const inserts = {};
  inserts.input = req.body.input;
  inserts.jsonata = req.body.jsonata;

  res.render('index.html', inserts);
};

module.exports = index;
