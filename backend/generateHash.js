import bcrypt from 'bcryptjs';

/**
 * Hash Password Generator
 * Run this script to generate a hashed password for the .env file
 * Usage: node generateHash.js
 */

const plainPassword = 'StrongPassword123';

bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('=================================');
  console.log('Hashed Password Generated!');
  console.log('=================================');
  console.log('Copy this hash to your .env file as CR_PASSWORD:');
  console.log('');
  console.log(hash);
  console.log('');
  console.log('=================================');
});
