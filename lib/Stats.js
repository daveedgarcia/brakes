'use strict';
const EventEmitter = require('events').EventEmitter;
const Bucket = require('./Bucket');

/* Example Default Options */
const defaultOptions = {
  bucketSpan: 1000,
  bucketNum: 60,
  statInterval: 1200
};

class Stats extends EventEmitter {

  constructor(opts) {
    super();
    this._opts = Object.assign({}, defaultOptions, opts);
    this._activePosition = this._opts.bucketNum - 1;

    // initialize buckets
    this._buckets = [];
    for (let i = 0; i < this._opts.bucketNum; i++) {
      this._buckets.push(new Bucket());
    }
    this._activeBucket = this._buckets[this._activePosition];
    this._startBucketSpinning();
  }

  reset() {
    for (let i = 0; i < this._opts.bucketNum; i++) {
      this._shiftAndPush(this._buckets, new Bucket());
    }
    this._activeBucket = this._buckets[this._activePosition];
    this._update();
  }

  /* Starts cycling through buckets */
  _startBucketSpinning() {
    this._spinningInterval = setInterval(() => {
      this._shiftAndPush(this._buckets, new Bucket());
      this._activeBucket = this._buckets[this._activePosition];
    }, this._opts.bucketSpan);
    this._spinningInterval.unref();
  }

  /* Stop Bucket from spinning */
  _stopBucketSpinning() {
    if (this._spinningInterval) {
      clearInterval(this._spinningInterval);
      this._spinningInterval = undefined;
      return true;
    }
    return false;
  }

  /* Starts cycling through buckets */
  startSnapshots(interval) {
    this._snapshotInterval = setInterval(
      () => {
        this._snapshot();
      },
      interval || this._opts.statInterval);
    this._snapshotInterval.unref();
  }

  /* Starts cycling through buckets */
  stopSnapshots() {
    if (this._snapshotInterval) {
      clearInterval(this._snapshotInterval);
      this._snapshotInterval = undefined;
      return true;
    }
    return false;
  }

  /* Generate new totals*/
  _generateStats(buckets) {
    // reduce buckets
    this._totals = buckets.reduce((prev, cur) => {
      if (!cur) return prev;

      prev.total += cur.total || 0;
      prev.failed += cur.failed || 0;
      prev.timedOut += cur.timedOut || 0;
      prev.successful += cur.successful || 0;

      return prev;
    }, {
      failed: 0,
      timedOut: 0,
      total: 0,
      successful: 0
    });

    return this._totals;
  }

  /* Update totals and send updated event */
  _update() {
    this.emit('update', this._generateStats(this._buckets));
  }

  _shiftAndPush(arr, item) {
    arr.push(item);
    arr.shift();
    return arr;
  }

  /* Send snapshot stats event */
  _snapshot() {
    this.emit('snapshot', this._totals);
  }

  /* Register a failure */
  failure() {
    this._activeBucket.failure();
    this._update();
  }

  /* Register a success */
  success() {
    this._activeBucket.success();
    this._update();
  }

  /* Register a timeout */
  timeout() {
    this._activeBucket.timeout();
    this._update();
  }

}

module.exports = Stats;
