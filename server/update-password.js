#!/usr/bin/env node

/**
 * Password Update Script
 * 
 * This script helps update user passwords in the authentication system.
 * It updates both the database and the hardcoded values in auth.js
 */

import { query } from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS = {
  'P1': { username: 'arda', name: 'Arda' },
  'P2': { username: 'deloscientos', name: 'Delos Cientos' },
  'P3': { username: 'paden', name: 'Paden' },
  'P4': { username: 'sendrijas', name: 'Sendrijas' },
  'P5': { username: 'tagarao', name: 'Tagarao' }
};

async function updatePassword(personId, newPassword) {
  if (!USERS[personId]) {
    throw new Error(`Invalid person ID: ${personId}. Valid IDs: ${Object.keys(USERS).join(', ')}`);
  }

  const user = USERS[personId];
  
  try {
    // 1. Update database
    console.log(`Updating password for ${user.name} (${user.username}) in database...`);
    await query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [newPassword, user.username]
    );
    console.log('✅ Database updated successfully');

    // 2. Update auth.js file
    console.log('Updating hardcoded password in auth.js...');
    const authFilePath = path.join(__dirname, 'src', 'routes', 'auth.js');
    let authContent = fs.readFileSync(authFilePath, 'utf8');
    
    // Replace the hardcoded password for this person ID
    const regex = new RegExp(`case '${personId}': expectedPassword = '[^']*'; break;`);
    const replacement = `case '${personId}': expectedPassword = '${newPassword}'; break;`;
    
    if (authContent.match(regex)) {
      authContent = authContent.replace(regex, replacement);
      fs.writeFileSync(authFilePath, authContent, 'utf8');
      console.log('✅ auth.js updated successfully');
    } else {
      console.log('⚠️  Could not find hardcoded password in auth.js to update');
    }

    console.log(`\n🎉 Password updated successfully for ${user.name}!`);
    console.log(`New password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    process.exit(1);
  }
}

// Command line usage
if (process.argv.length !== 4) {
  console.log('Usage: node update-password.js <PERSON_ID> <NEW_PASSWORD>');
  console.log('Example: node update-password.js P5 MyNewPassword123!');
  console.log('\nValid Person IDs:');
  Object.entries(USERS).forEach(([id, user]) => {
    console.log(`  ${id}: ${user.name} (${user.username})`);
  });
  process.exit(1);
}

const personId = process.argv[2];
const newPassword = process.argv[3];

updatePassword(personId, newPassword)
  .then(() => {
    console.log('\n📝 Remember to restart your server for changes to take effect!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to update password:', error.message);
    process.exit(1);
  });
