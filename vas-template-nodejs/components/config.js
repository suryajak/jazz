/**
	Nodejs Template Project
  @module: config.js
  @description: Defines variables/functions to retrieve environment related data
	@author:
	@version: 1.0
**/
const fs = require('fs');
const path = require('path');

var getStageConfig = () => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, `../config/prod-config.json`)));
};

module.exports = {
  getConfig: getStageConfig
};
