module.exports = {
  "extends": "eslint:recommended",
  "env": {
    "browser": true,
    "node": true,
  },
  "globals": {
    "$": false,
    "$$": false,
    "busta": false,
    "client": false,
    "debug_busta": false,
    "ga": false,
    "Hammer": false,
    "io": false,
    "me": false,
    "Modernizr": false,
    "n": false,
    "scene_transform": false,
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
