'use strict';

const Brakes = require('../lib/Brakes');
const timer = 100;
let successRate = 2;
let iterations = 0;

function unreliableServiceCall() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      iterations++;
      if (iterations === 10) {
        successRate = 0.6;
      }
      else if (iterations === 100) {
        successRate = 0.1;
      }
      else if (iterations === 200) {
        successRate = 1;
      }


      if (Math.random() <= successRate) {
        resolve();
      }
      else {
        reject();
      }
    }, timer);
  });
}


const brake = new Brakes(unreliableServiceCall, {
  statInterval: 2500,
  threshold: 0.5,
  circuitDuration: 15000,
  timeout: 250
});

brake.on('snapshot', (stats) => {
  console.log('Running at:', stats.successful / stats.total);
  console.log(stats);
});

brake.on('circuitBroken', () => {
  console.log('----------Circuit Broken--------------');
});

brake.on('circuitOpen', () => {
  console.log('----------Circuit Open--------------');
});

setInterval(() => {
  brake.exec()
    .then(() => {
      console.log('Succesful');
    })
    .catch((err) => {
      console.log('Failure', err || '');
    });
}, 100);
