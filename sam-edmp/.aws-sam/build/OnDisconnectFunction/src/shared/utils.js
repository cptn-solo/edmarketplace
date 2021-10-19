var crypto = require('crypto');

exports.uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

exports.sha256 = (str) => {

  // secret or salt to be hashed with
  const secret = "xt23s778RHY";

  // create a sha-256 hasher
  //const sha256Hasher = crypto.createHmac("sha256", new Buffer(secret, 'utf-8'));
  const sha256Hasher = crypto.createHmac("sha256", secret);

  // hash the string
  // and set the output format
  //const hash = sha256Hasher.update(new Buffer(str, 'utf-8')).digest("hex");
  const hash = sha256Hasher.update(str).digest("hex");

  console.log(str+'=>'+hash);

  // A unique sha256 hash 😃
  return hash;
};