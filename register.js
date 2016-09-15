const fs    = require('fs');
const path  = require('path');
const hfc   = require('hfc');
const debug = require('debug')('script');

process.env['GRPC_SSL_CIPHER_SUITES'] = [
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-SHA256',
  'ECDHE-RSA-AES256-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES128-SHA256',
  'ECDHE-ECDSA-AES256-SHA384',
  'ECDHE-ECDSA-AES256-GCM-SHA384'
].join(':');

const credential  = JSON.parse(fs.readFileSync(path.resolve(process.env.FABRIC_CREDENTIAL_PATH)));
const certificate = fs.readFileSync(path.resolve(process.env.FABRIC_CERTIFICATE_PATH));
const networkId   = credential.peers[0].network_id;
const ca          = credential.ca[`${networkId}-ca`];
const users       = credential.users;

const chain = hfc.newChain('my-chain');
chain.setKeyValStore(hfc.newFileKeyValStore(path.resolve(`tmp/stores/${networkId}`)));
chain.setMemberServicesUrl(`grpcs://${ca.discovery_host}:${ca.discovery_port}`, { pem: certificate });

chain.enroll(users[0].enrollId, users[0].enrollSecret, (err, admin) => {
  if (err) return debug(err);

  // set registrar
  chain.setRegistrar(admin);

  const registrationRequest = {
    enrollmentID: 'miniturbo',
    account: 'group1',
    affiliation: '0001'
  };

  // register new member
  chain.register(registrationRequest, (err, enrollmentSecret) => {
    if (err) return debug(err);
    debug('Enrollment Id: %s', registrationRequest.enrollmentID);
    debug('Enrollment Secret: %s', enrollmentSecret);
  });
});
