module.exports = {
  "extends": "eslint:recommended",
  "env": {
    "browser": true,
    "node": true,
  },
  "globals": {
    "_paq": false,
    "$": false,
    "$$": false,
    "busta": false,
    "client": false,
    "Hammer": false,
    "io": false,
    "me": false,
    "Modernizr": false,
    "TWEEN": false,
    "Two": false,
    "two": false,
    "ZUI": false,
  },
  "rules": {
    "comma-dangle": ["error", "always-multiline"],
    "no-console": "off",
    "semi": ["error", "always"],
  }
};
