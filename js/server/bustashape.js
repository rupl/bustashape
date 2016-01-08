var bustashape = {
  // Time-limit in milliseconds. Smaller numbers mean shapes are "harder" to rip.
  collisionThresholdTime: 50,

  // Number of collisions before shapes actually rip. Higher numbers mean shapes
  // are "harder" to rip.
  collisionThresholdRepeats: 3,

  // Stores the previous change so we can compare.
  previousChange: {},

  // Function to compare two change events. Fires the proper callback
  checkForChanges: function (props, nope, yep) {
    var previous = this.previousChange;
    console.log('previous', previous);

    // debug
    console.log('current', props);

    // Try to detect a change. For now, a collision is defined as two people
    // attempting to move the same shape within 50ms of each other.
    var now = new Date();
    var timediff = now - previous.timestamp;
    props.timestamp = now;
    this.previousChange = props;

    // debug more
    console.log('⏰  ' + timediff + 'ms');

    // Is it colliding or not? If the same user caused two events, then ignore it.
    if (timediff < this.collisionThresholdTime && props.me !== previous.me) {
      return yep();
    } else {
      return nope();
    }
  }
};

module.exports = bustashape;
