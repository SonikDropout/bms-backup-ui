const { writable } = require('svelte/store');
const { SERIAL_DATA } = require('../common/constants');
const { isLoading } = require('./utils/translator');
const client = require('./utils/wsClient');

const initialData = SERIAL_DATA.reduce((a, e) => {
  a[e.name] = 0;
  return a;
}, {});
const serialData = writable(initialData);
const chargePercent = writable(0);

const appInitialized = writable(false);

const localeLoaded = new Promise(
  (resolve) => void isLoading.subscribe((f) => (f ? void 0 : resolve()))
);

const connectionEstablished = new Promise((resolve, reject) => {
  client.once('serial data', resolve);
  client.on('connect_error', reject);
});

Promise.all([localeLoaded])
  .then(() => {
    appInitialized.set(true);
  })
  .catch(console.error);

client.on('serial data', (packet) => {
  serialData.update((data) => {
    for (let key in packet) {
      data[key] = packet[key];
    }
    resetChargePercent(data);
    return data;
  });
});

function resetChargePercent(data) {
  chargePercent.set(
    Math.max(
      0,
      ((data.batVoltage - data.minBatVoltage) /
        (data.maxBatVoltage - data.minBatVoltage)) *
        100
    ).toFixed(1)
  );
}

function getValue(store) {
  let $val;
  store.subscribe(($) => ($val = $))();
  return $val;
}

const time = writable('');

client.on('time', time.set);

module.exports = {
  serialData,
  appInitialized,
  getValue,
  time,
  chargePercent,
};
